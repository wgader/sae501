<?php

declare(strict_types=1);

namespace App\Tests\Controller;

use App\Entity\Association;
use App\Entity\Materiel;
use App\Entity\ReservationMateriel;
use App\Entity\ReservationMaterielLigne;
use App\Entity\ReservationSalle;
use App\Entity\Salle;

final class ScheduleHistoryControllerTest extends ControllerRouteTestCase
{
    public function testHistoryRequiresAuthentication(): void
    {
        $this->assertRequiresAuthentication('GET', '/api/schedules/history');
    }

    public function testAssociationHistoryIsForcedToItsOwnAssociation(): void
    {
        $association = $this->signInAssociationMember(['salles', 'materiel'])->getAssociation();
        self::assertInstanceOf(Association::class, $association);
        $other = (new Association())->setNom('Autre association')->setStatut('VALIDATED');
        $this->em->persist($other);

        $room = $this->createRoom();
        $equipment = $this->createEquipment();
        $this->createRoomReservation($association, $room, '2025-03-10 09:00:00');
        $this->createRoomReservation($other, $room, '2025-04-10 09:00:00');
        $this->createEquipmentReservation($association, $equipment, '2024-06-10 09:00:00', 3);
        $this->createRoomReservation($association, $room, '2026-01-10 09:00:00');
        $this->em->flush();

        $this->client->request('GET', '/api/schedules/history?asso_id='.$other->getId());

        $this->assertResponseIsSuccessful();
        $data = json_decode((string) $this->client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame($association->getId(), $data['association']['id']);
        self::assertSame(1, $data['totals']['roomReservationCount']);
        self::assertSame(1, $data['totals']['equipmentReservationCount']);
        self::assertSame(3, $data['totals']['equipmentQuantity']);
        self::assertSame(2.5, $data['totals']['roomHoursGranted']);
        self::assertCount(2, $data['seasons']);
    }

    public function testMairieRequiresAndCanSelectAnAssociation(): void
    {
        $this->signInAgent(['ROLE_MAIRIE']);
        $this->client->request('GET', '/api/schedules/history');
        $this->assertResponseStatusCodeSame(400);

        $association = (new Association())->setNom('Association municipale')->setStatut('VALIDATED');
        $this->em->persist($association);
        $this->em->flush();

        $this->client->request('GET', '/api/schedules/history?asso_id='.$association->getId());
        $this->assertResponseIsSuccessful();
        $data = json_decode((string) $this->client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame($association->getId(), $data['association']['id']);

        $this->client->request('GET', '/api/schedules/history?asso_id=999999');
        $this->assertResponseStatusCodeSame(404);
    }

    private function createRoom(): Salle
    {
        $room = (new Salle())
            ->setNom('Salle des fêtes')
            ->setAdresse('1 place de la mairie')
            ->setCapaciteMax(100)
            ->setAccesPmr(true)
            ->setEquipementsInclus([])
            ->setCreatedAt(new \DateTimeImmutable())
            ->setUpdatedAt(new \DateTimeImmutable())
            ->setIsActive(true);
        $this->em->persist($room);

        return $room;
    }

    private function createEquipment(): Materiel
    {
        $equipment = (new Materiel())
            ->setDesignation('Barnum')
            ->setCategorie('Animation')
            ->setStockTotal(10);
        $this->em->persist($equipment);

        return $equipment;
    }

    private function createRoomReservation(
        Association $association,
        Salle $room,
        string $date,
    ): ReservationSalle {
        $start = new \DateTimeImmutable($date);
        $reservation = (new ReservationSalle())
            ->setAssociation($association)
            ->setSalle($room)
            ->setMotifEvenement('Événement historique')
            ->setDateDebut($start)
            ->setDateFin($start->modify('+2 hours 30 minutes'))
            ->setStatut('Validée');
        $this->em->persist($reservation);

        return $reservation;
    }

    private function createEquipmentReservation(
        Association $association,
        Materiel $equipment,
        string $date,
        int $quantity,
    ): ReservationMateriel {
        $start = new \DateTimeImmutable($date);
        $reservation = (new ReservationMateriel())
            ->setAssociation($association)
            ->setMotifEvenement('Attribution historique')
            ->setDateRetrait($start)
            ->setDateRestitution($start->modify('+1 day'))
            ->setStatut('Validée');
        $line = (new ReservationMaterielLigne())
            ->setMateriel($equipment)
            ->setQuantite($quantity);
        $reservation->addLigne($line);
        $this->em->persist($reservation);

        return $reservation;
    }
}
