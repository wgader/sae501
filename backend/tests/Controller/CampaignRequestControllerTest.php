<?php

declare(strict_types=1);

namespace App\Tests\Controller;

use App\Entity\Association;
use App\Entity\Campaign;
use App\Entity\DemandeStatusHistory;
use App\Entity\Notification;
use App\Entity\ReservationSalle;
use App\Entity\Salle;
use App\Entity\User;

/**
 * Gestion des demandes de salle d’une campagne annuelle par la mairie.
 */
final class CampaignRequestControllerTest extends ControllerRouteTestCase
{
    private Campaign $campaign;
    private Association $association;
    private User $member;
    private Salle $grandeSalle;
    private Salle $petiteSalle;

    protected function setUp(): void
    {
        parent::setUp();

        $now = new \DateTimeImmutable();
        $this->campaign = (new Campaign())
            ->setSeasonLabel('Saison 2027-2028')
            ->setOpeningAt($now->modify('-1 day'))
            ->setClosingAt($now->modify('+30 days'))
            ->setResourceTypes(['salle'])
            ->setStatus(Campaign::STATUS_ACTIVE);
        $this->association = (new Association())->setNom('Amicale du parc')->setStatut('VALIDATED')->setModuleSalleActif(true);
        $this->member = (new User())
            ->setEmail('amicale@example.test')
            ->setNom('Dupont')
            ->setPrenom('Alice')
            ->setTypeCompte('association')
            ->setRoles(['ROLE_ASSOCIATION'])
            ->setIsVerified(true)
            ->setAssociation($this->association);
        $this->association->addUser($this->member);
        $this->grandeSalle = $this->salle('Grande salle', 150);
        $this->petiteSalle = $this->salle('Petite salle', 20);

        foreach ([$this->campaign, $this->association, $this->member, $this->grandeSalle, $this->petiteSalle] as $entity) {
            $this->em->persist($entity);
        }
        $this->em->flush();
    }

    public function testRequestsRequireAuthentication(): void
    {
        $this->assertRequiresAuthentication('GET', $this->url('/requests'));
    }

    public function testAssociationCannotManageCampaignRequests(): void
    {
        $request = $this->pendingRequest('10:00', '12:00');
        $this->client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer '.$this->jwtManager->create($this->member));

        $this->client->request('GET', $this->url('/requests'));
        $this->assertResponseStatusCodeSame(403);

        $this->client->request('POST', $this->url('/requests/'.$request->getId().'/accept'));
        $this->assertResponseStatusCodeSame(403);
    }

    public function testListShowsRealRequestsAndFlagsOverlaps(): void
    {
        $first = $this->pendingRequest('10:00', '12:00');
        $second = $this->pendingRequest('11:00', '13:00');
        $this->authenticateAsAdmin();

        $this->client->request('GET', $this->url('/requests'));

        $this->assertResponseIsSuccessful();
        $data = $this->response();
        self::assertSame('Saison 2027-2028', $data['campaign']['seasonLabel']);
        self::assertCount(2, $data['requests']);
        self::assertSame('pending', $data['requests'][0]['status']);
        self::assertSame('Amicale du parc', $data['requests'][0]['association']['nom']);
        self::assertSame([(int) $second->getId()], $data['requests'][0]['conflictsWith']);
        self::assertSame([(int) $first->getId()], $data['requests'][1]['conflictsWith']);
    }

    public function testRequestFromAnotherCampaignIsNotFound(): void
    {
        $other = (new Campaign())
            ->setSeasonLabel('Saison passée')
            ->setOpeningAt(new \DateTimeImmutable('-400 days'))
            ->setClosingAt(new \DateTimeImmutable('-300 days'))
            ->setResourceTypes(['salle'])
            ->setStatus(Campaign::STATUS_CLOSED);
        $this->em->persist($other);
        $request = $this->pendingRequest('10:00', '12:00')->setCampaign($other);
        $this->em->flush();
        $this->authenticateAsAdmin();

        $this->client->request('POST', $this->url('/requests/'.$request->getId().'/accept'));

        $this->assertResponseStatusCodeSame(404);
    }

    public function testAcceptNotifiesTheAssociationInAppAndByEmail(): void
    {
        $request = $this->pendingRequest('10:00', '12:00');
        $this->authenticateAsAdmin();

        $this->client->request('POST', $this->url('/requests/'.$request->getId().'/accept'));

        $this->assertResponseIsSuccessful();
        self::assertSame('accepted', $this->response()['status']);
        $this->assertEmailCount(1);
        $email = $this->getMailerMessage();
        self::assertNotNull($email);
        $this->assertEmailAddressContains($email, 'To', 'amicale@example.test');
        $this->assertEmailHeaderSame($email, 'Subject', 'Réservation de salle acceptée — Mairie de Feytiat');
        $notification = $this->em->getRepository(Notification::class)->findOneBy(['user' => $this->member]);
        self::assertInstanceOf(Notification::class, $notification);
        self::assertSame('Réservation de salle acceptée', $notification->getTitle());
        self::assertSame(1, $this->em->getRepository(DemandeStatusHistory::class)->count(['demandeId' => $request->getId()]));
    }

    public function testAcceptingOverAnAcceptedBookingIsAConflict(): void
    {
        $accepted = $this->pendingRequest('10:00', '12:00')->setStatut('Validée');
        $request = $this->pendingRequest('11:00', '13:00');
        $this->em->flush();
        $this->authenticateAsAdmin();

        $this->client->request('POST', $this->url('/requests/'.$request->getId().'/accept'));

        $this->assertResponseStatusCodeSame(409);
        self::assertSame($accepted->getId(), $this->response()['conflicts'][0]['id']);
        $this->assertEmailCount(0);
    }

    public function testRefuseStoresTheOptionalReason(): void
    {
        $request = $this->pendingRequest('10:00', '12:00');
        $this->authenticateAsAdmin();

        $this->requestJson('POST', $this->url('/requests/'.$request->getId().'/refuse'), ['reason' => '  Salle en travaux ce jour-là.  ']);

        $this->assertResponseIsSuccessful();
        $data = $this->response();
        self::assertSame('refused', $data['status']);
        self::assertSame('Salle en travaux ce jour-là.', $data['decisionComment']);
        $this->assertEmailCount(1);
        $this->assertEmailHtmlBodyContains($this->getMailerMessage() ?? throw new \LogicException(), 'Salle en travaux ce jour-là.');
    }

    public function testRefuseWithoutReasonIsAllowed(): void
    {
        $request = $this->pendingRequest('10:00', '12:00');
        $this->authenticateAsAdmin();

        $this->requestJson('POST', $this->url('/requests/'.$request->getId().'/refuse'), []);

        $this->assertResponseIsSuccessful();
        self::assertNull($this->response()['decisionComment']);
    }

    public function testRescheduleMovesTheRequestAndAcceptsIt(): void
    {
        $request = $this->pendingRequest('10:00', '12:00');
        $this->authenticateAsAdmin();
        $day = $this->day()->modify('+1 day')->format('Y-m-d');

        $this->requestJson('PATCH', $this->url('/requests/'.$request->getId()), [
            'salleId' => $this->petiteSalle->getId(),
            'dateDebut' => $day.'T14:00:00+01:00',
            'dateFin' => $day.'T16:00:00+01:00',
            'reason' => 'La grande salle est prise, nous vous proposons la petite.',
        ]);

        $this->assertResponseIsSuccessful();
        $data = $this->response();
        self::assertSame('accepted', $data['status']);
        self::assertSame('Petite salle', $data['salle']['nom']);
        self::assertStringStartsWith($day.'T14:00:00', $data['dateDebut']);
        $this->assertEmailCount(1);
        $this->assertEmailHeaderSame($this->getMailerMessage() ?? throw new \LogicException(), 'Subject', 'Réservation de salle modifiée — Mairie de Feytiat');
    }

    public function testRescheduleRejectsSlotsOutsideOpeningHours(): void
    {
        $request = $this->pendingRequest('10:00', '12:00');
        $this->authenticateAsAdmin();
        $day = $this->day()->format('Y-m-d');

        $this->requestJson('PATCH', $this->url('/requests/'.$request->getId()), [
            'salleId' => $this->grandeSalle->getId(),
            'dateDebut' => $day.'T06:00:00+01:00',
            'dateFin' => $day.'T07:00:00+01:00',
        ]);

        $this->assertResponseStatusCodeSame(422);
    }

    public function testAdminCanAddASlotToAnAssociation(): void
    {
        $this->authenticateAsAdmin();
        $day = $this->day()->format('Y-m-d');

        $this->requestJson('POST', $this->url('/requests'), [
            'associationId' => $this->association->getId(),
            'salleId' => $this->grandeSalle->getId(),
            'dateDebut' => $day.'T18:00:00+01:00',
            'dateFin' => $day.'T20:00:00+01:00',
            'motifEvenement' => 'Entraînement hebdomadaire',
        ]);

        $this->assertResponseStatusCodeSame(201);
        $data = $this->response();
        self::assertSame('accepted', $data['status']);
        self::assertSame('Entraînement hebdomadaire', $data['motifEvenement']);
        $reservation = $this->em->getRepository(ReservationSalle::class)->find($data['id']);
        self::assertSame($this->campaign->getId(), $reservation?->getCampaign()?->getId());
        $this->assertEmailCount(1);
    }

    public function testAddSlotRequiresAMotif(): void
    {
        $this->authenticateAsAdmin();
        $day = $this->day()->format('Y-m-d');

        $this->requestJson('POST', $this->url('/requests'), [
            'associationId' => $this->association->getId(),
            'salleId' => $this->grandeSalle->getId(),
            'dateDebut' => $day.'T18:00:00+01:00',
            'dateFin' => $day.'T20:00:00+01:00',
            'motifEvenement' => '   ',
        ]);

        $this->assertResponseStatusCodeSame(422);
    }

    public function testExtendingAClosedCampaignReopensIt(): void
    {
        $this->campaign->setStatus(Campaign::STATUS_CLOSED)->setClosingAt(new \DateTimeImmutable('-1 hour'));
        $this->em->flush();
        $this->authenticateAsAdmin();

        $this->requestJson('PATCH', $this->url('/schedule'), [
            'openingAt' => (new \DateTimeImmutable('-10 days'))->format(\DateTimeInterface::ATOM),
            'closingAt' => (new \DateTimeImmutable('+10 days'))->format(\DateTimeInterface::ATOM),
        ]);

        $this->assertResponseIsSuccessful();
        self::assertSame(Campaign::STATUS_ACTIVE, $this->response()['status']);
    }

    public function testPostponingTheOpeningReprogramsTheCampaign(): void
    {
        $this->authenticateAsAdmin();

        $this->requestJson('PATCH', $this->url('/schedule'), [
            'openingAt' => (new \DateTimeImmutable('+5 days'))->format(\DateTimeInterface::ATOM),
            'closingAt' => (new \DateTimeImmutable('+40 days'))->format(\DateTimeInterface::ATOM),
        ]);

        $this->assertResponseIsSuccessful();
        self::assertSame(Campaign::STATUS_PROGRAMMED, $this->response()['status']);
    }

    public function testScheduleRejectsIncoherentDates(): void
    {
        $this->authenticateAsAdmin();

        $this->requestJson('PATCH', $this->url('/schedule'), [
            'openingAt' => '2027-06-30T09:00:00+02:00',
            'closingAt' => '2027-06-01T09:00:00+02:00',
        ]);

        $this->assertResponseStatusCodeSame(422);
    }

    public function testOnlyOneCampaignCanBeOpenAtATime(): void
    {
        $other = (new Campaign())
            ->setSeasonLabel('Autre saison')
            ->setOpeningAt(new \DateTimeImmutable('+10 days'))
            ->setClosingAt(new \DateTimeImmutable('+20 days'))
            ->setResourceTypes(['salle']);
        $this->em->persist($other);
        $this->em->flush();
        $this->authenticateAsAdmin();

        $this->client->request('POST', '/api/admin/campaigns/'.$other->getId().'/open');

        $this->assertResponseStatusCodeSame(409);
    }

    public function testReservationSubmittedDuringAnOpenCampaignIsLinkedToIt(): void
    {
        $this->client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer '.$this->jwtManager->create($this->member));
        $day = $this->day()->format('Y-m-d');

        $this->client->request('POST', '/api/campaigns/current/requests', [
            'salleId' => (string) $this->grandeSalle->getId(),
            'motifEvenement' => 'Assemblée générale',
            'dateDebut' => $day.'T10:00:00+01:00',
            'dateFin' => $day.'T12:00:00+01:00',
        ], [], ['HTTP_ACCEPT' => 'application/json']);

        $this->assertResponseStatusCodeSame(201);
        $reservation = $this->em->getRepository(ReservationSalle::class)->findOneBy(['motifEvenement' => 'Assemblée générale']);
        self::assertSame($this->campaign->getId(), $reservation?->getCampaign()?->getId());
    }

    private function url(string $suffix): string
    {
        return '/api/admin/campaigns/'.$this->campaign->getId().$suffix;
    }

    /**
     * @return array<string, mixed>
     */
    private function response(): array
    {
        return json_decode((string) $this->client->getResponse()->getContent(), true, 512, \JSON_THROW_ON_ERROR);
    }

    private function day(): \DateTimeImmutable
    {
        return new \DateTimeImmutable('+7 days');
    }

    private function pendingRequest(string $start, string $end): ReservationSalle
    {
        $day = $this->day()->format('Y-m-d');
        $reservation = (new ReservationSalle())
            ->setAssociation($this->association)
            ->setSalle($this->grandeSalle)
            ->setCampaign($this->campaign)
            ->setMotifEvenement('Répétition')
            ->setDateDebut(new \DateTimeImmutable($day.' '.$start))
            ->setDateFin(new \DateTimeImmutable($day.' '.$end))
            ->setCreatedAt(new \DateTimeImmutable());
        $this->em->persist($reservation);
        $this->em->flush();

        return $reservation;
    }

    private function salle(string $nom, int $capacite): Salle
    {
        return (new Salle())
            ->setNom($nom)
            ->setAdresse('12 rue de la République, 87220 Feytiat')
            ->setCapaciteMax($capacite)
            ->setAccesPmr(true)
            ->setIsActive(true)
            ->setCreatedAt(new \DateTimeImmutable())
            ->setUpdatedAt(new \DateTimeImmutable());
    }
}
