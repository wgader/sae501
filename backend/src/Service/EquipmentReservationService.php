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
    /** Horizon de réservation, repris par le calendrier. */
    public const BOOKING_HORIZON = '+1 year';
    private const LOCAL_TIMEZONE = 'Europe/Paris';

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly MaterielRepository $materielRepository,
        private readonly ReservationMaterielRepository $reservationRepository,
        private readonly EquipmentReservationStatusNotifier $statusNotifier,
        private readonly AppSettingsService $settings,
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
        if ($start > $now->modify(self::BOOKING_HORIZON)) {
            throw new \InvalidArgumentException('Le matériel se réserve au plus un an à l’avance.');
        }
        if ($lines === []) {
            throw new \InvalidArgumentException('La réservation doit contenir au moins un équipement.');
        }
        $this->assertDeskHours($start, $end);
        $this->assertQuantities($lines);

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
                if (self::countDays($start, $end) > $item->getMaxConsecutiveDays()) {
                    throw new \InvalidArgumentException(\sprintf(
                        '« %s » se réserve pour %d jour(s) d’affilée au maximum.',
                        $item->getDesignation(),
                        $item->getMaxConsecutiveDays(),
                    ));
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

    private static function countDays(\DateTimeImmutable $start, \DateTimeImmutable $end): int
    {
        $firstDay = new \DateTimeImmutable($start->format('Y-m-d'));
        $lastDay = new \DateTimeImmutable($end->format('Y-m-d'));

        return (int) $firstDay->diff($lastDay)->days + 1;
    }

    /** Le retrait et la restitution se font aux heures du service de prêt, en heure de Paris. */
    private function assertDeskHours(\DateTimeImmutable $start, \DateTimeImmutable $end): void
    {
        $settings = $this->settings->current();
        $opening = AppSettingsService::toMinutes($settings->getEquipmentDeskOpening());
        $closing = AppSettingsService::toMinutes($settings->getEquipmentDeskClosing());
        $zone = new \DateTimeZone(self::LOCAL_TIMEZONE);

        foreach (['Le retrait' => $start, 'La restitution' => $end] as $moment => $instant) {
            $local = $instant->setTimezone($zone);
            $minutes = (int) $local->format('G') * 60 + (int) $local->format('i');
            if ($minutes < $opening || $minutes > $closing) {
                throw new \InvalidArgumentException(\sprintf(
                    '%s se fait entre %s et %s.',
                    $moment,
                    str_replace(':', 'h', $settings->getEquipmentDeskOpening()),
                    str_replace(':', 'h', $settings->getEquipmentDeskClosing()),
                ));
            }
        }
    }

    /**
     * @param list<array{materielId: int, quantite: int}> $lines
     */
    private function assertQuantities(array $lines): void
    {
        $max = $this->settings->current()->getEquipmentMaxQuantityPerRequest();
        foreach ($lines as $line) {
            if ($line['quantite'] < 1) {
                throw new \InvalidArgumentException('La quantité demandée doit être d’au moins 1.');
            }
            if ($max !== null && $line['quantite'] > $max) {
                throw new \InvalidArgumentException(\sprintf(
                    'La mairie limite chaque demande à %d unité%s par équipement.',
                    $max,
                    $max > 1 ? 's' : '',
                ));
            }
        }
    }
}
