<?php

declare(strict_types=1);

namespace App\Tests\Controller;

use App\Entity\Association;
use App\Entity\Campaign;
use App\Entity\Notification;
use App\Entity\ReservationSalle;
use App\Entity\Salle;
use App\Entity\User;

/**
 * Cycle de vie d’une campagne et des réservations : dates conservées, réouverture, verrouillage
 * après clôture, annulations notifiées, réservations ponctuelles traitées par la mairie.
 */
final class RoomBookingLifecycleTest extends ControllerRouteTestCase
{
    private User $agent;
    private User $member;
    private Association $association;
    private Salle $salle;

    protected function setUp(): void
    {
        parent::setUp();

        $this->agent = $this->createUser('agent@example.test', 'mairie', ['ROLE_GESTION_SALLE']);
        $this->association = (new Association())->setNom('Club de lecture')->setStatut('VALIDATED')->setModuleSalleActif(true);
        $this->em->persist($this->association);
        $this->member = $this->createUser('membre@example.test', 'association', ['ROLE_ASSOCIATION']);
        $this->association->addUser($this->member);
        $this->salle = (new Salle())
            ->setNom('Salle des fêtes')
            ->setAdresse('Place de la mairie')
            ->setCapaciteMax(120)
            ->setAccesPmr(true)
            ->setIsActive(true)
            ->setCreatedAt(new \DateTimeImmutable())
            ->setUpdatedAt(new \DateTimeImmutable());
        $this->em->persist($this->salle);
        $this->em->flush();
    }

    public function testOpeningEarlyKeepsTheScheduledDates(): void
    {
        $campaign = $this->createCampaign(Campaign::STATUS_PROGRAMMED, '+5 days', '+30 days');
        $plannedOpening = $campaign->getOpeningAt()?->format(\DateTimeInterface::ATOM);
        $this->authenticate($this->agent);

        $this->client->request('POST', '/api/admin/campaigns/'.$campaign->getId().'/open');

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains(['status' => Campaign::STATUS_ACTIVE, 'openingAt' => $plannedOpening]);
    }

    public function testScheduleSavesTheBookablePeriod(): void
    {
        $campaign = $this->createCampaign(Campaign::STATUS_PROGRAMMED, '+5 days', '+30 days');
        $this->authenticate($this->agent);

        $this->requestJson('PATCH', '/api/admin/campaigns/'.$campaign->getId().'/schedule', [
            'openingAt' => (new \DateTimeImmutable('+5 days'))->format(\DateTimeInterface::ATOM),
            'closingAt' => (new \DateTimeImmutable('+30 days'))->format(\DateTimeInterface::ATOM),
            'periodStart' => '2027-09-01',
            'periodEnd' => '2028-06-30',
        ]);

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains(['periodStart' => '2027-09-01', 'periodEnd' => '2028-06-30']);
    }

    public function testClosedCampaignCanBeReopenedWithItsRequests(): void
    {
        $campaign = $this->createCampaign(Campaign::STATUS_CLOSED, '-20 days', '-1 day');
        $this->createReservation($campaign, 'En attente de validation par la mairie');
        $this->authenticate($this->agent);

        $this->requestJson('POST', '/api/admin/campaigns/'.$campaign->getId().'/reopen');
        $this->assertResponseStatusCodeSame(422);

        $this->requestJson('POST', '/api/admin/campaigns/'.$campaign->getId().'/reopen', [
            'closingAt' => (new \DateTimeImmutable('+7 days'))->format(\DateTimeInterface::ATOM),
        ]);
        $this->assertResponseIsSuccessful();
        $this->assertJsonContains(['status' => Campaign::STATUS_ACTIVE]);

        $this->client->request('GET', '/api/admin/campaigns/'.$campaign->getId().'/requests');
        self::assertCount(1, $this->response()['requests']);
    }

    public function testAssociationCannotCancelOnceTheCampaignIsClosed(): void
    {
        $campaign = $this->createCampaign(Campaign::STATUS_CLOSED, '-20 days', '-1 day');
        $reservation = $this->createReservation($campaign, 'En attente de validation par la mairie');
        $this->authenticate($this->member);

        $this->requestJson('POST', '/api/association/requests/sal-'.$reservation->getId().'/cancel', ['type' => 'salle']);

        $this->assertResponseStatusCodeSame(422);
        $this->em->refresh($reservation);
        self::assertSame('En attente de validation par la mairie', $reservation->getStatut());
    }

    public function testAssociationCancellationNotifiesBothSides(): void
    {
        $campaign = $this->createCampaign(Campaign::STATUS_ACTIVE, '-1 day', '+20 days');
        $reservation = $this->createReservation($campaign, 'En attente de validation par la mairie');
        $this->authenticate($this->member);

        $this->requestJson('POST', '/api/association/requests/sal-'.$reservation->getId().'/cancel', ['type' => 'salle']);

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains(['statut' => 'Annulée']);
        self::assertSame(1, $this->countNotifications($this->member));
        self::assertSame(1, $this->countNotifications($this->agent));
        self::assertEmailCount(2);
    }

    public function testTownHallCanCancelAfterClosureWithAReason(): void
    {
        $campaign = $this->createCampaign(Campaign::STATUS_CLOSED, '-20 days', '-1 day');
        $reservation = $this->createReservation($campaign, 'Validée');
        $this->authenticate($this->agent);

        $this->requestJson('POST', '/api/admin/campaigns/'.$campaign->getId().'/requests/'.$reservation->getId().'/cancel', [
            'reason' => 'Salle fermée pour travaux.',
        ]);

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains(['status' => 'closed', 'decisionComment' => 'Salle fermée pour travaux.']);
        self::assertSame(1, $this->countNotifications($this->member));
    }

    public function testOneOffRequestsAreListedAndHandledByTheTownHall(): void
    {
        $reservation = $this->createReservation(null, 'En attente de validation par la mairie');
        $this->createReservation($this->createCampaign(Campaign::STATUS_CLOSED, '-20 days', '-1 day'), 'Validée', '+12 days');

        $this->authenticate($this->member);
        $this->client->request('GET', '/api/admin/room-requests');
        $this->assertResponseStatusCodeSame(403);

        $this->authenticate($this->agent);
        $this->client->request('GET', '/api/admin/room-requests');
        $this->assertResponseIsSuccessful();
        self::assertCount(1, $this->response()['requests']);

        $this->requestJson('POST', '/api/admin/room-requests/'.$reservation->getId().'/accept');
        $this->assertResponseIsSuccessful();
        $this->assertJsonContains(['status' => 'accepted']);
    }

    public function testAssociationSeesItsCampaignRequests(): void
    {
        $campaign = $this->createCampaign(Campaign::STATUS_ACTIVE, '-1 day', '+20 days');
        $this->createReservation($campaign, 'En attente de validation par la mairie');
        $this->createReservation(null, 'Validée', '+40 days');

        $this->client->request('GET', '/api/campaigns/current/requests');
        $this->assertResponseStatusCodeSame(401);

        $this->authenticate($this->member);
        $this->client->request('GET', '/api/campaigns/current/requests');
        $this->assertResponseIsSuccessful();
        $this->assertJsonContains(['campaign' => ['id' => $campaign->getId()]]);
        self::assertCount(1, $this->response()['requests']);
    }

    private function createCampaign(string $status, string $opening, string $closing): Campaign
    {
        $now = new \DateTimeImmutable();
        $campaign = (new Campaign())
            ->setSeasonLabel('Saison test')
            ->setOpeningAt($now->modify($opening))
            ->setClosingAt($now->modify($closing))
            ->setResourceTypes(['salle'])
            ->setStatus($status);
        $this->em->persist($campaign);
        $this->em->flush();

        return $campaign;
    }

    private function createReservation(?Campaign $campaign, string $status, string $dayOffset = '+10 days'): ReservationSalle
    {
        $day = (new \DateTimeImmutable($dayOffset))->format('Y-m-d');
        $reservation = (new ReservationSalle())
            ->setAssociation($this->association)
            ->setSalle($this->salle)
            ->setCampaign($campaign)
            ->setMotifEvenement('Assemblée générale')
            ->setDateDebut(new \DateTimeImmutable($day.' 18:00'))
            ->setDateFin(new \DateTimeImmutable($day.' 20:00'))
            ->setStatut($status)
            ->setCreatedAt(new \DateTimeImmutable());
        $this->em->persist($reservation);
        $this->em->flush();

        return $reservation;
    }

    /**
     * @param list<string> $roles
     */
    private function createUser(string $email, string $type, array $roles): User
    {
        $user = (new User())
            ->setEmail($email)
            ->setNom('Test')
            ->setPrenom('Compte')
            ->setTypeCompte($type)
            ->setRoles($roles)
            ->setIsVerified(true);
        $this->em->persist($user);

        return $user;
    }

    private function authenticate(User $user): void
    {
        $this->client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer '.$this->jwtManager->create($user));
    }

    private function countNotifications(User $user): int
    {
        return $this->em->getRepository(Notification::class)->count(['user' => $user]);
    }

    /**
     * @return array<string, mixed>
     */
    private function response(): array
    {
        return json_decode((string) $this->client->getResponse()->getContent(), true, 512, \JSON_THROW_ON_ERROR);
    }
}
