<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Association;
use App\Entity\Materiel;
use App\Entity\ReservationMateriel;
use App\Entity\ReservationMaterielLigne;
use App\Exception\EquipmentReservationConflictException;
use App\Repository\MaterielRepository;
use App\Repository\ReservationMaterielRepository;
use Doctrine\ORM\EntityManagerInterface;

final class EquipmentReservationService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly MaterielRepository $materielRepository,
        private readonly ReservationMaterielRepository $reservationRepository,
        private readonly EquipmentReservationStatusNotifier $statusNotifier,
    ) {
    }

    /**
     * @param list<array{materielId: int, quantite: int}> $lines
     */
    public function create(
        Association $association,
        string $motif,
        \DateTimeImmutable $start,
        \DateTimeImmutable $end,
        array $lines,
    ): ReservationMateriel {
        if ($motif === '') {
            throw new \InvalidArgumentException("Le motif de l'événement est obligatoire.");
        }

        $now = new \DateTimeImmutable();
        if ($start < $now) {
            throw new \InvalidArgumentException('La date de retrait ne peut pas être passée.');
        }
        if ($end <= $start) {
            throw new \InvalidArgumentException(
                'La date de restitution doit être postérieure à la date de retrait.',
            );
        }
        if ($lines === []) {
            throw new \InvalidArgumentException('La réservation doit contenir au moins un équipement.');
        }

        $ids = array_map(static fn (array $line): int => $line['materielId'], $lines);
        if (count($ids) !== count(array_unique($ids))) {
            throw new \InvalidArgumentException('Un équipement ne peut apparaître qu’une seule fois.');
        }
        sort($ids);

        $connection = $this->entityManager->getConnection();
        $connection->beginTransaction();

        try {
            $equipment = $this->materielRepository->findForReservationUpdate($ids);
            $equipmentById = [];
            foreach ($equipment as $item) {
                if ($item->getId() !== null) {
                    $equipmentById[$item->getId()] = $item;
                }
            }

            if (count($equipmentById) !== count($ids)) {
                throw new \InvalidArgumentException('Un ou plusieurs équipements sont introuvables.');
            }

            foreach ($equipmentById as $item) {
                if ($item->isArchived()) {
                    throw new \InvalidArgumentException('Un équipement sélectionné n’est plus disponible.');
                }
            }

            $engagedByEquipment = [];
            foreach ($this->reservationRepository->getEngagedStockByEquipment($start, $end) as $row) {
                $engagedByEquipment[(int) $row['id']] = (int) $row['engagedStock'];
            }

            $conflicts = [];
            foreach ($lines as $line) {
                $item = $equipmentById[$line['materielId']];
                $stockTotal = $item->getStockTotal() ?? 0;
                $available = max(0, $stockTotal - ($engagedByEquipment[$line['materielId']] ?? 0));
                if ($line['quantite'] > $available) {
                    $conflicts[$line['materielId']] = [
                        'requested' => $line['quantite'],
                        'available' => $available,
                    ];
                }
            }

            if ($conflicts !== []) {
                throw new EquipmentReservationConflictException(
                    'Le stock disponible a changé. Ajustez les quantités ou les dates.',
                    $conflicts,
                );
            }

            $reservation = (new ReservationMateriel())
                ->setAssociation($association)
                ->setMotifEvenement($motif)
                ->setDateRetrait($start)
                ->setDateRestitution($end);

            foreach ($lines as $line) {
                $reservation->addLigne(
                    (new ReservationMaterielLigne())
                        ->setMateriel($equipmentById[$line['materielId']])
                        ->setQuantite($line['quantite']),
                );
            }

            $this->entityManager->persist($reservation);
            $this->entityManager->flush();
            $connection->commit();

            $this->statusNotifier->notifySubmitted($reservation);

            return $reservation;
        } catch (\Throwable $exception) {
            if ($connection->isTransactionActive()) {
                $connection->rollBack();
            }

            throw $exception;
        }
    }
}
