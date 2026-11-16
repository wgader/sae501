<?php

declare(strict_types=1);

namespace App\Tests\Controller;

use App\Entity\Association;
use App\Entity\Campaign;
use App\Entity\ReservationSalle;
use App\Entity\Salle;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

final class RoomReservationControllerTest extends WebTestCase
{
    private const CAMPAIGN_URI = '/api/campaigns/current/requests';

    private KernelBrowser $client;
    private EntityManagerInterface $em;
    private JWTTokenManagerInterface $jwtManager;
    protected function setUp(): void
    {
        $this->client = static::createClient();
        $this->em = static::getContainer()->get(EntityManagerInterface::class);
        $this->jwtManager = static::getContainer()->get(JWTTokenManagerInterface::class);

        $schemaTool = new SchemaTool($this->em);
        $metadata = $this->em->getMetadataFactory()->getAllMetadata();
        $schemaTool->dropSchema($metadata);
        $schemaTool->createSchema($metadata);
    }

    /**
     * Campagne dont la période réservable couvre les 60 prochains jours.
     */
    private function createCampaign(string $status, string $opening, string $closing): Campaign
    {
        $now = new \DateTimeImmutable();
        $campaign = (new Campaign())
            ->setSeasonLabel('Saison test')
            ->setOpeningAt($now->modify($opening))
            ->setClosingAt($now->modify($closing))
            ->setPeriodStart($now->modify('+1 day'))
            ->setPeriodEnd($now->modify('+60 days'))
            ->setResourceTypes(['salle'])
            ->setStatus($status);
        $this->em->persist($campaign);
        $this->em->flush();

        return $campaign;
    }

    private function createAssociationAndUser(string $nomAsso, bool $moduleSalleActif = true): array
    {
        $asso = new Association();
        $asso->setNom($nomAsso);
        $asso->setStatut('VALIDATED');
        $asso->setModuleSalleActif($moduleSalleActif);
        $this->em->persist($asso);

        $user = new User();
        $user->setEmail(strtolower(str_replace(' ', '', $nomAsso)) . '@example.com');
        $user->setNom('Dupont');
        $user->setPrenom('Alice');
        $user->setTypeCompte('association');
        $user->setRoles(['ROLE_ASSOCIATION']);
        $user->setIsVerified(true);
        $user->setAssociation($asso);
        $this->em->persist($user);

        $this->em->flush();

        return [$user, $asso];
    }

    private function createSalle(string $nom, int $capacite = 100): Salle
    {
        $salle = new Salle();
        $salle->setNom($nom);
        $salle->setAdresse('12 Rue de la République 87220 Feytiat');
        $salle->setCapaciteMax($capacite);
        $salle->setAccesPmr(true);
        $salle->setEquipementsInclus(['wifi', 'videoprojecteur', 'chaises']);
        $salle->setIsActive(true);
        $salle->setCreatedAt(new \DateTimeImmutable());
        $salle->setUpdatedAt(new \DateTimeImmutable());
        $this->em->persist($salle);
        $this->em->flush();

        return $salle;
    }

    private function requestWithAuth(User $user, string $method, string $uri, array $body = []): void
    {
        $token = $this->jwtManager->create($user);
        $content = $body !== [] ? json_encode($body) : null;
        $this->client->request($method, $uri, [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
            'CONTENT_TYPE' => 'application/json',
            'HTTP_ACCEPT' => 'application/json',
        ], $content);
    }

    public function testCatalogReturnsActiveRooms(): void
    {
        $this->createSalle('Salle des Fêtes', 200);

        $this->client->request('GET', '/api/rooms');
        $this->assertResponseIsSuccessful();

        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertIsArray($data);
        $this->assertCount(1, $data);
        $this->assertSame('Salle des Fêtes', $data[0]['nom']);
        $this->assertSame('08:00', $data[0]['horairesOuverture']['debut']);
        $this->assertSame('23:00', $data[0]['horairesOuverture']['fin']);
    }

    public function testAvailabilityRequiresAuthentication(): void
    {
        $salle = $this->createSalle('Gymnase');
        $this->client->request('GET', '/api/rooms/' . $salle->getId() . '/availability');
        $this->assertResponseStatusCodeSame(401);
    }

    public function testAvailabilityForbiddenWhenModuleSalleDisabled(): void
    {
        [$user] = $this->createAssociationAndUser('Club Théâtre', false);
        $salle = $this->createSalle('Salle Jean Jaurès');

        $this->requestWithAuth($user, 'GET', '/api/rooms/' . $salle->getId() . '/availability');
        $this->assertResponseStatusCodeSame(403);
    }

    public function testAvailabilityReturnsOccupiedSlots(): void
    {
        [$user, $asso] = $this->createAssociationAndUser('Club Gym');
        $salle = $this->createSalle('Salle Polyvalente');

        // Créer une réservation existante pré-réservée
        $res = new ReservationSalle();
        $res->setAssociation($asso);
        $res->setSalle($salle);
        $res->setMotifEvenement('Stage vacances');
        $res->setDateDebut(new \DateTimeImmutable('2026-11-15 09:00:00'));
        $res->setDateFin(new \DateTimeImmutable('2026-11-15 12:00:00'));
        $res->setStatut('En attente de validation par la mairie');
        $this->em->persist($res);
        $this->em->flush();

        $this->requestWithAuth(
            $user,
            'GET',
            '/api/rooms/' . $salle->getId() . '/availability?start=2026-11-01T00:00:00Z&end=2026-11-30T23:59:59Z',
        );

        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertCount(1, $data['occupiedSlots']);
        $this->assertTrue($data['occupiedSlots'][0]['isPreReserved']);
    }

    public function testCreateReservationFailsWhenDatesIncoherent(): void
    {
        [$user] = $this->createAssociationAndUser('Association Sportive');
        $salle = $this->createSalle('Salle B');

        // Heure de fin <= heure de début
        $this->requestWithAuth($user, 'POST', '/api/rooms/reservations', [
            'salleId' => $salle->getId(),
            'motifEvenement' => 'Entraînement',
            'dateDebut' => '2026-12-10T14:00:00+01:00',
            'dateFin' => '2026-12-10T12:00:00+01:00',
        ]);
        $this->assertResponseStatusCodeSame(400);

        // Date dans le passé
        $this->requestWithAuth($user, 'POST', '/api/rooms/reservations', [
            'salleId' => $salle->getId(),
            'motifEvenement' => 'Passé',
            'dateDebut' => '2020-01-01T10:00:00+01:00',
            'dateFin' => '2020-01-01T12:00:00+01:00',
        ]);
        $this->assertResponseStatusCodeSame(400);
    }

    public function testCreateReservationFailsWhenOutsideOpeningHours(): void
    {
        [$user] = $this->createAssociationAndUser('Asso Danse');
        $salle = $this->createSalle('Salle C');

        // Début avant 08h00
        $this->requestWithAuth($user, 'POST', '/api/rooms/reservations', [
            'salleId' => $salle->getId(),
            'motifEvenement' => 'Répétition matinale',
            'dateDebut' => '2026-12-15T06:00:00+01:00',
            'dateFin' => '2026-12-15T09:00:00+01:00',
        ]);
        $this->assertResponseStatusCodeSame(400);

        // Fin après 23h00
        $this->requestWithAuth($user, 'POST', '/api/rooms/reservations', [
            'salleId' => $salle->getId(),
            'motifEvenement' => 'Soirée tardive',
            'dateDebut' => '2026-12-15T21:00:00+01:00',
            'dateFin' => '2026-12-15T23:30:00+01:00',
        ]);
        $this->assertResponseStatusCodeSame(400);
    }

    public function testCreateReservationFailsWhenCapacityExceeded(): void
    {
        [$user] = $this->createAssociationAndUser('Asso Musique');
        $salle = $this->createSalle('Petite Salle', 40);

        $this->requestWithAuth($user, 'POST', '/api/rooms/reservations', [
            'salleId' => $salle->getId(),
            'motifEvenement' => 'Concert public',
            'dateDebut' => '2026-12-20T14:00:00+01:00',
            'dateFin' => '2026-12-20T18:00:00+01:00',
            'capaciteAttendue' => 80,
        ]);
        $this->assertResponseStatusCodeSame(400);
    }

    public function testCreateReservationSucceedsAndSetsPendingValidationStatus(): void
    {
        [$user] = $this->createAssociationAndUser('Amicale Laïque');
        $salle = $this->createSalle('Grande Salle', 150);

        $this->requestWithAuth($user, 'POST', '/api/rooms/reservations', [
            'salleId' => $salle->getId(),
            'motifEvenement' => 'Assemblée Générale',
            'dateDebut' => '2026-12-22T10:00:00+01:00',
            'dateFin' => '2026-12-22T13:00:00+01:00',
            'capaciteAttendue' => 90,
        ]);

        $this->assertResponseStatusCodeSame(201);
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertSame('En attente de validation par la mairie', $data['statut']);
        $this->assertSame('Assemblée Générale', $data['motifEvenement']);
        $this->assertNotNull($data['id']);
    }

    public function testCreateReservationConflictReturns409WhenOverlapping(): void
    {
        [$user, $asso] = $this->createAssociationAndUser('Club Escalade');
        $salle = $this->createSalle('Salle Mur');

        // Réservation existante de 14h à 17h
        $res = new ReservationSalle();
        $res->setAssociation($asso);
        $res->setSalle($salle);
        $res->setMotifEvenement('Session jeunes');
        $res->setDateDebut(new \DateTimeImmutable('2026-12-23 14:00:00'));
        $res->setDateFin(new \DateTimeImmutable('2026-12-23 17:00:00'));
        $res->setStatut('En attente de validation par la mairie');
        $this->em->persist($res);
        $this->em->flush();

        // Tentative de réserver chevauchant (15h à 18h)
        $this->requestWithAuth($user, 'POST', '/api/rooms/reservations', [
            'salleId' => $salle->getId(),
            'motifEvenement' => 'Session adultes',
            'dateDebut' => '2026-12-23T15:00:00+01:00',
            'dateFin' => '2026-12-23T18:00:00+01:00',
        ]);

        $this->assertResponseStatusCodeSame(409);
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertSame('ROOM_SLOT_CONFLICT', $data['code']);
        $this->assertNotEmpty($data['conflicts']);
    }

    public function testOneOffReservationIsNotAttachedToACampaign(): void
    {
        [$user] = $this->createAssociationAndUser('Club Photo');
        $salle = $this->createSalle('Salle Photo');

        $this->postSlot($user, '/api/rooms/reservations', $salle, 'Exposition', '+10 days', '10:00', '12:00');

        $this->assertResponseStatusCodeSame(201);
        $reservation = $this->em->getRepository(ReservationSalle::class)->findOneBy(['motifEvenement' => 'Exposition']);
        $this->assertNull($reservation?->getCampaign());
    }

    public function testCampaignRequestIsAttachedToTheOpenCampaign(): void
    {
        $campaign = $this->createCampaign(Campaign::STATUS_ACTIVE, '-1 day', '+30 days');
        [$user] = $this->createAssociationAndUser('Club Photo');
        $salle = $this->createSalle('Salle Photo');

        $this->postSlot($user, self::CAMPAIGN_URI, $salle, 'Exposition', '+10 days', '10:00', '12:00');

        $this->assertResponseStatusCodeSame(201);
        $reservation = $this->em->getRepository(ReservationSalle::class)->findOneBy(['motifEvenement' => 'Exposition']);
        $this->assertSame($campaign->getId(), $reservation?->getCampaign()?->getId());
    }

    public function testCampaignRequestsOnTheSameSlotAreKeptForArbitration(): void
    {
        $this->createCampaign(Campaign::STATUS_ACTIVE, '-1 day', '+30 days');
        [$firstUser] = $this->createAssociationAndUser('Club A');
        [$secondUser] = $this->createAssociationAndUser('Club B');
        $salle = $this->createSalle('Salle disputée');

        $this->postSlot($firstUser, self::CAMPAIGN_URI, $salle, 'Gala A', '+12 days', '18:00', '21:00');
        $this->assertResponseStatusCodeSame(201);
        $this->postSlot($secondUser, self::CAMPAIGN_URI, $salle, 'Gala B', '+12 days', '19:00', '22:00');
        $this->assertResponseStatusCodeSame(201);
    }

    public function testCampaignRequestCannotOverlapAnAcceptedSlot(): void
    {
        $campaign = $this->createCampaign(Campaign::STATUS_ACTIVE, '-1 day', '+30 days');
        [$user, $asso] = $this->createAssociationAndUser('Club A');
        $salle = $this->createSalle('Salle attribuée');
        $day = (new \DateTimeImmutable('+12 days'))->format('Y-m-d');
        $accepted = (new ReservationSalle())
            ->setAssociation($asso)
            ->setSalle($salle)
            ->setCampaign($campaign)
            ->setMotifEvenement('Déjà attribué')
            ->setDateDebut(new \DateTimeImmutable($day.' 18:00'))
            ->setDateFin(new \DateTimeImmutable($day.' 21:00'))
            ->setStatut('Validée');
        $this->em->persist($accepted);
        $this->em->flush();

        $this->postSlot($user, self::CAMPAIGN_URI, $salle, 'Gala', '+12 days', '19:00', '22:00');

        $this->assertResponseStatusCodeSame(409);
    }

    public function testCampaignRequestOutsideTheBookablePeriodIsRefused(): void
    {
        $this->createCampaign(Campaign::STATUS_ACTIVE, '-1 day', '+30 days');
        [$user] = $this->createAssociationAndUser('Club Lointain');
        $salle = $this->createSalle('Salle');

        $this->postSlot($user, self::CAMPAIGN_URI, $salle, 'Trop tard', '+90 days', '10:00', '12:00');

        $this->assertResponseStatusCodeSame(400);
        $this->assertSame(0, $this->em->getRepository(ReservationSalle::class)->count([]));
    }

    public function testCampaignRequestIsRefusedOnceTheCampaignIsClosed(): void
    {
        $this->createCampaign(Campaign::STATUS_CLOSED, '-10 days', '-1 hour');
        $this->assertCampaignRequestRefused();
    }

    public function testCampaignRequestIsRefusedWhenTheCampaignEndedButIsStillMarkedOpen(): void
    {
        // La date de clôture est passée : la synchronisation ferme la campagne avant la vérification.
        $this->createCampaign(Campaign::STATUS_ACTIVE, '-10 days', '-1 minute');
        $this->assertCampaignRequestRefused();
    }

    public function testCampaignRequestIsRefusedBeforeTheCampaignOpens(): void
    {
        $this->createCampaign(Campaign::STATUS_PROGRAMMED, '+2 days', '+30 days');
        $this->assertCampaignRequestRefused();
    }

    public function testOneOffReservationIsRefusedWhileACampaignIsOpen(): void
    {
        $this->createCampaign(Campaign::STATUS_ACTIVE, '-1 day', '+30 days');
        [$user] = $this->createAssociationAndUser('Club Pressé');
        $salle = $this->createSalle('Salle');

        $this->postSlot($user, '/api/rooms/reservations', $salle, 'Ponctuel', '+90 days', '10:00', '12:00');

        $this->assertResponseStatusCodeSame(403);
        $this->assertSame('ROOM_ONE_OFF_CLOSED', $this->responseData()['code']);
    }

    public function testOneOffReservationCannotTakeADayOfAnUpcomingCampaign(): void
    {
        $this->createCampaign(Campaign::STATUS_PROGRAMMED, '+2 days', '+30 days');
        [$user] = $this->createAssociationAndUser('Club Anticipé');
        $salle = $this->createSalle('Salle');

        $this->postSlot($user, '/api/rooms/reservations', $salle, 'Dans la campagne', '+10 days', '10:00', '12:00');
        $this->assertResponseStatusCodeSame(403);
        $this->assertSame('ROOM_SLOT_IN_CAMPAIGN', $this->responseData()['code']);

        $this->postSlot($user, '/api/rooms/reservations', $salle, 'Après la campagne', '+90 days', '10:00', '12:00');
        $this->assertResponseStatusCodeSame(201);
    }

    private function postSlot(User $user, string $uri, Salle $salle, string $motif, string $dayOffset, string $start, string $end): void
    {
        $day = (new \DateTimeImmutable($dayOffset))->format('Y-m-d');
        $this->requestWithAuth($user, 'POST', $uri, [
            'salleId' => $salle->getId(),
            'motifEvenement' => $motif,
            'dateDebut' => $day.'T'.$start.':00',
            'dateFin' => $day.'T'.$end.':00',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function responseData(): array
    {
        return json_decode((string) $this->client->getResponse()->getContent(), true);
    }

    private function assertCampaignRequestRefused(): void
    {
        [$user] = $this->createAssociationAndUser('Club Tardif');
        $salle = $this->createSalle('Salle Tardive');

        $this->postSlot($user, self::CAMPAIGN_URI, $salle, 'Demande hors campagne', '+10 days', '10:00', '12:00');

        $this->assertResponseStatusCodeSame(403);
        $this->assertSame('ROOM_CAMPAIGN_CLOSED', $this->responseData()['code']);
        $this->assertSame(0, $this->em->getRepository(ReservationSalle::class)->count([]));
    }
}
