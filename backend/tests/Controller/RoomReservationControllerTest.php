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
    private KernelBrowser $client;
    private EntityManagerInterface $em;
    private JWTTokenManagerInterface $jwtManager;
    private Campaign $campaign;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $this->em = static::getContainer()->get(EntityManagerInterface::class);
        $this->jwtManager = static::getContainer()->get(JWTTokenManagerInterface::class);

        $schemaTool = new SchemaTool($this->em);
        $metadata = $this->em->getMetadataFactory()->getAllMetadata();
        $schemaTool->dropSchema($metadata);
        $schemaTool->createSchema($metadata);

        $this->campaign = $this->createCampaign(Campaign::STATUS_ACTIVE, '-1 day', '+30 days');
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

    public function testCreateReservationIsAttachedToTheOpenCampaign(): void
    {
        [$user] = $this->createAssociationAndUser('Club Photo');
        $salle = $this->createSalle('Salle Photo');

        $this->requestWithAuth($user, 'POST', '/api/rooms/reservations', [
            'salleId' => $salle->getId(),
            'motifEvenement' => 'Exposition',
            'dateDebut' => '2026-12-24T10:00:00+01:00',
            'dateFin' => '2026-12-24T12:00:00+01:00',
        ]);

        $this->assertResponseStatusCodeSame(201);
        $reservation = $this->em->getRepository(ReservationSalle::class)->findOneBy(['motifEvenement' => 'Exposition']);
        $this->assertSame($this->campaign->getId(), $reservation?->getCampaign()?->getId());
    }

    public function testCreateReservationIsRefusedOnceTheCampaignIsClosed(): void
    {
        $this->campaign->setStatus(Campaign::STATUS_CLOSED)->setClosingAt(new \DateTimeImmutable('-1 hour'));
        $this->em->flush();
        $this->assertReservationRefusedWhileClosed();
    }

    public function testCreateReservationIsRefusedWhenTheCampaignEndedButIsStillMarkedOpen(): void
    {
        // La date de clôture est passée : la synchronisation ferme la campagne avant la vérification.
        $this->campaign->setClosingAt(new \DateTimeImmutable('-1 minute'));
        $this->em->flush();
        $this->assertReservationRefusedWhileClosed();
    }

    public function testCreateReservationIsRefusedBeforeTheCampaignOpens(): void
    {
        $this->em->remove($this->campaign);
        $this->createCampaign(Campaign::STATUS_PROGRAMMED, '+2 days', '+30 days');
        $this->assertReservationRefusedWhileClosed();
    }

    private function assertReservationRefusedWhileClosed(): void
    {
        [$user] = $this->createAssociationAndUser('Club Tardif');
        $salle = $this->createSalle('Salle Tardive');

        $this->requestWithAuth($user, 'POST', '/api/rooms/reservations', [
            'salleId' => $salle->getId(),
            'motifEvenement' => 'Demande hors campagne',
            'dateDebut' => '2026-12-26T10:00:00+01:00',
            'dateFin' => '2026-12-26T12:00:00+01:00',
        ]);

        $this->assertResponseStatusCodeSame(403);
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertSame('ROOM_CAMPAIGN_CLOSED', $data['code']);
        $this->assertSame(0, $this->em->getRepository(ReservationSalle::class)->count([]));
    }
}
