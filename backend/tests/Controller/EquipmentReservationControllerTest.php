<?php

namespace App\Tests\Controller;

use App\Entity\AppSettings;
use App\Entity\Association;
use App\Entity\Materiel;
use App\Entity\ReservationMateriel;
use App\Entity\ReservationMaterielLigne;
use App\Entity\User;

final class EquipmentReservationControllerTest extends ControllerRouteTestCase
{
    public function testEquipmentReservationRequiresAuthentication(): void
    {
        $this->assertRequiresAuthentication('POST', '/api/equipment/reservations');
    }

    public function testReservationCannotExceedTheEquipmentLimit(): void
    {
        $association = $this->authenticateMember();
        $equipment = $this->createEquipment(maxDays: 2);

        $this->reserve($equipment, '+10 days 09:00', '+12 days 18:00');

        $this->assertResponseStatusCodeSame(422);
        $this->assertStringContainsString('2 jour(s)', $this->message());
        self::assertSame(0, $this->em->getRepository(ReservationMateriel::class)->count(['association' => $association]));

        $this->reserve($equipment, '+10 days 09:00', '+11 days 18:00');

        $this->assertResponseStatusCodeSame(201);
    }

    public function testPickupAndReturnFollowTheLendingDeskHours(): void
    {
        $this->authenticateMember();
        $equipment = $this->createEquipment();
        $settings = (new AppSettings());
        $settings->updateEquipment('09:00', '12:00', 'Services techniques', 2, 7);
        $this->em->persist($settings);
        $this->em->flush();

        $this->reserve($equipment, '+10 days 08:30', '+11 days 11:00');
        $this->assertResponseStatusCodeSame(422);
        self::assertSame('Le retrait se fait entre 09h00 et 12h00.', $this->message());

        $this->reserve($equipment, '+10 days 09:00', '+11 days 14:00');
        $this->assertResponseStatusCodeSame(422);
        self::assertSame('La restitution se fait entre 09h00 et 12h00.', $this->message());

        $this->reserve($equipment, '+10 days 09:00', '+11 days 12:00', quantity: 3);
        $this->assertResponseStatusCodeSame(422);
        self::assertStringContainsString('2 unités par équipement', $this->message());

        $this->reserve($equipment, '+10 days 09:00', '+11 days 12:00', quantity: 2);
        $this->assertResponseStatusCodeSame(201);

        $this->client->request('GET', '/api/equipment/'.$equipment->getId().'/occupancy');
        $data = json_decode((string) $this->client->getResponse()->getContent(), true);
        self::assertSame(['09:00', '12:00', 'Services techniques', 2], [$data['deskOpening'], $data['deskClosing'], $data['pickupLocation'], $data['maxQuantityPerRequest']]);
    }

    public function testReservationCannotStartMoreThanAYearAhead(): void
    {
        $this->authenticateMember();

        $this->reserve($this->createEquipment(), '+2 years 09:00', '+2 years 18:00');

        $this->assertResponseStatusCodeSame(422);
    }

    public function testOccupancyListsEngagedQuantitiesAndRules(): void
    {
        $association = $this->authenticateMember();
        $equipment = $this->createEquipment(maxDays: 4);
        $line = (new ReservationMaterielLigne())->setMateriel($equipment)->setQuantite(3);
        $reservation = (new ReservationMateriel())
            ->setAssociation($association)
            ->setMotifEvenement('Fête')
            ->setDateRetrait(new \DateTimeImmutable('+5 days 09:00'))
            ->setDateRestitution(new \DateTimeImmutable('+6 days 18:00'))
            ->addLigne($line);
        $this->em->persist($reservation);
        $this->em->flush();

        $this->client->request('GET', '/api/equipment/'.$equipment->getId().'/occupancy');

        $this->assertResponseIsSuccessful();
        $data = json_decode((string) $this->client->getResponse()->getContent(), true);
        self::assertSame(4, $data['maxConsecutiveDays']);
        self::assertSame(10, $data['stockTotal']);
        self::assertCount(1, $data['reservations']);
        self::assertSame(3, $data['reservations'][0]['quantite']);
        self::assertArrayNotHasKey('association', $data['reservations'][0]);
    }

    public function testOccupancyRequiresAnAssociationWithTheEquipmentModule(): void
    {
        $equipment = $this->createEquipment();

        $this->client->request('GET', '/api/equipment/'.$equipment->getId().'/occupancy');
        $this->assertResponseStatusCodeSame(401);

        $this->authenticateMember(moduleActive: false);
        $this->client->request('GET', '/api/equipment/'.$equipment->getId().'/occupancy');
        $this->assertResponseStatusCodeSame(403);
    }

    private function authenticateMember(bool $moduleActive = true): Association
    {
        $association = (new Association())
            ->setNom('Club du matériel')
            ->setStatut('VALIDATED')
            ->setModuleMaterielActif($moduleActive);
        $user = (new User())
            ->setEmail('materiel@example.test')
            ->setNom('Membre')
            ->setPrenom('Club')
            ->setTypeCompte('association')
            ->setRoles(['ROLE_ASSOCIATION'])
            ->setIsVerified(true);
        $association->addUser($user);
        $this->em->persist($association);
        $this->em->persist($user);
        $this->em->flush();
        $this->client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer '.$this->jwtManager->create($user));

        return $association;
    }

    private function createEquipment(int $maxDays = Materiel::DEFAULT_MAX_CONSECUTIVE_DAYS): Materiel
    {
        $equipment = (new Materiel())
            ->setDesignation('Barnum')
            ->setCategorie('barnums')
            ->setStockTotal(10)
            ->setMaxConsecutiveDays($maxDays);
        $this->em->persist($equipment);
        $this->em->flush();

        return $equipment;
    }

    /** Les heures sont celles du formulaire, en heure de Paris. */
    private function reserve(Materiel $equipment, string $start, string $end, int $quantity = 1): void
    {
        $paris = new \DateTimeZone('Europe/Paris');
        $this->requestJson('POST', '/api/equipment/reservations', [
            'motifEvenement' => 'Fête de quartier',
            'dateRetrait' => (new \DateTimeImmutable($start, $paris))->format(\DateTimeInterface::ATOM),
            'dateRestitution' => (new \DateTimeImmutable($end, $paris))->format(\DateTimeInterface::ATOM),
            'lignes' => [['materielId' => $equipment->getId(), 'quantite' => $quantity]],
        ]);
    }

    private function message(): string
    {
        return (string) json_decode((string) $this->client->getResponse()->getContent(), true)['message'];
    }
}
