<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Association;
use App\Repository\ReservationMaterielRepository;
use App\Repository\ReservationSalleRepository;

final class ScheduleHistoryService
{
    public function __construct(
        private readonly ReservationSalleRepository $roomReservations,
        private readonly ReservationMaterielRepository $equipmentReservations,
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function build(Association $association): array
    {
        $now = new \DateTimeImmutable();
        $before = (new \DateTimeImmutable('first day of January '.$now->format('Y')))->setTime(0, 0);

        $roomReservations = $this->roomReservations->findHistoricalValidatedByAssociation($association, $before);
        $equipmentReservations = $this->equipmentReservations->findHistoricalValidatedByAssociation($association, $before);

        $seasons = [];
        $rooms = [];
        $equipment = [];
        $totalRoomHours = 0.0;
        $totalEquipmentQuantity = 0;

        foreach ($roomReservations as $reservation) {
            $start = $reservation->getDateDebut();
            $end = $reservation->getDateFin();
            $room = $reservation->getSalle();
            if (null === $start || null === $end || null === $room) {
                continue;
            }

            $year = (int) $start->format('Y');
            $campaign = $reservation->getCampaign();
            $seasonLabel = null !== $campaign && '' !== trim((string) $campaign->getSeasonLabel())
                ? trim((string) $campaign->getSeasonLabel())
                : (string) $year;
            $hours = max(0.0, round(($end->getTimestamp() - $start->getTimestamp()) / 3600, 2));
            $slot = [
                'id' => $reservation->getId(),
                'motifEvenement' => $reservation->getMotifEvenement(),
                'dateDebut' => $start->format(\DateTimeInterface::ATOM),
                'dateFin' => $end->format(\DateTimeInterface::ATOM),
                'hours' => $hours,
                'salle' => [
                    'id' => $room->getId(),
                    'nom' => $room->getNom(),
                ],
            ];

            $season = &$this->ensureSeason($seasons, $seasonLabel, $year);
            ++$season['roomReservationCount'];
            $season['roomHoursGranted'] = round($season['roomHoursGranted'] + $hours, 2);
            $season['roomSlots'][] = $slot;
            unset($season);

            $roomId = (int) $room->getId();
            if (!isset($rooms[$roomId])) {
                $rooms[$roomId] = [
                    'id' => $roomId,
                    'nom' => $room->getNom(),
                    'totalHours' => 0.0,
                    'reservationCount' => 0,
                    'seasons' => [],
                ];
            }
            $rooms[$roomId]['totalHours'] = round($rooms[$roomId]['totalHours'] + $hours, 2);
            ++$rooms[$roomId]['reservationCount'];
            $rooms[$roomId]['seasons'][$seasonLabel] = round(
                ($rooms[$roomId]['seasons'][$seasonLabel] ?? 0) + $hours,
                2,
            );
            $totalRoomHours = round($totalRoomHours + $hours, 2);
        }

        foreach ($equipmentReservations as $reservation) {
            $start = $reservation->getDateRetrait();
            $end = $reservation->getDateRestitution();
            if (null === $start || null === $end) {
                continue;
            }

            $year = (int) $start->format('Y');
            $seasonLabel = (string) $year;
            $assignments = [];

            foreach ($reservation->getLignes() as $line) {
                $materiel = $line->getMateriel();
                if (null === $materiel) {
                    continue;
                }

                $quantity = $line->getQuantite();
                $materielId = (int) $materiel->getId();
                $assignments[] = [
                    'id' => $line->getId(),
                    'materielId' => $materielId,
                    'designation' => $materiel->getDesignation(),
                    'quantite' => $quantity,
                ];

                if (!isset($equipment[$materielId])) {
                    $equipment[$materielId] = [
                        'id' => $materielId,
                        'designation' => $materiel->getDesignation(),
                        'totalQuantity' => 0,
                        'reservationCount' => 0,
                        'seasons' => [],
                    ];
                }
                $equipment[$materielId]['totalQuantity'] += $quantity;
                ++$equipment[$materielId]['reservationCount'];
                $equipment[$materielId]['seasons'][$seasonLabel] =
                    ($equipment[$materielId]['seasons'][$seasonLabel] ?? 0) + $quantity;
                $totalEquipmentQuantity += $quantity;
            }

            $season = &$this->ensureSeason($seasons, $seasonLabel, $year);
            ++$season['equipmentReservationCount'];
            $season['equipmentQuantity'] += array_sum(array_column($assignments, 'quantite'));
            $season['equipmentAssignments'][] = [
                'id' => $reservation->getId(),
                'motifEvenement' => $reservation->getMotifEvenement(),
                'dateRetrait' => $start->format(\DateTimeInterface::ATOM),
                'dateRestitution' => $end->format(\DateTimeInterface::ATOM),
                'lignes' => $assignments,
            ];
            unset($season);
        }

        uasort($seasons, static fn (array $a, array $b): int => $b['year'] <=> $a['year'] ?: strcmp($b['label'], $a['label']));

        return [
            'association' => [
                'id' => $association->getId(),
                'nom' => $association->getNom(),
            ],
            'totals' => [
                'roomReservationCount' => count($roomReservations),
                'roomHoursGranted' => $totalRoomHours,
                'equipmentReservationCount' => count($equipmentReservations),
                'equipmentQuantity' => $totalEquipmentQuantity,
            ],
            'seasons' => array_values($seasons),
            'rooms' => array_values($rooms),
            'equipment' => array_values($equipment),
        ];
    }

    /**
     * @param array<string, array<string, mixed>> $seasons
     *
     * @return array<string, mixed>
     */
    private function &ensureSeason(array &$seasons, string $label, int $year): array
    {
        if (!isset($seasons[$label])) {
            $seasons[$label] = [
                'label' => $label,
                'year' => $year,
                'roomReservationCount' => 0,
                'roomHoursGranted' => 0.0,
                'roomSlots' => [],
                'equipmentReservationCount' => 0,
                'equipmentQuantity' => 0,
                'equipmentAssignments' => [],
            ];
        }

        return $seasons[$label];
    }
}
