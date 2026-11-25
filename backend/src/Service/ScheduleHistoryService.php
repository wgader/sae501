<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Association;
use App\Entity\ReservationMateriel;
use App\Entity\ReservationSalle;
use App\Repository\ReservationMaterielRepository;
use App\Repository\ReservationSalleRepository;

/**
 * Bilan des salles et du matériel attribués à une association, regroupé par année.
 *
 * Chaque année porte ses totaux, un récapitulatif par salle et par matériel (pour la
 * visualisation) et la liste détaillée des attributions, de la plus récente à la plus ancienne.
 */
final class ScheduleHistoryService
{
    public function __construct(
        private readonly ReservationSalleRepository $roomReservations,
        private readonly ReservationMaterielRepository $equipmentReservations,
    ) {
    }

    /**
     * @return array{
     *     association: array{id: ?int, nom: ?string},
     *     totals: array{roomReservationCount: int, roomHoursGranted: float, equipmentReservationCount: int, equipmentQuantity: int},
     *     years: list<array<string, mixed>>
     * }
     */
    public function build(Association $association): array
    {
        /** @var array<int, array<string, mixed>> $years */
        $years = [];
        $totals = ['roomReservationCount' => 0, 'roomHoursGranted' => 0.0, 'equipmentReservationCount' => 0, 'equipmentQuantity' => 0];

        foreach ($this->roomReservations->findGrantedByAssociation($association) as $reservation) {
            $attribution = $this->roomAttribution($reservation);
            if (null === $attribution) {
                continue;
            }

            $year = &$this->year($years, (int) substr($attribution['start'], 0, 4));
            $hours = $attribution['hours'];
            ++$year['roomReservationCount'];
            $year['roomHoursGranted'] = round($year['roomHoursGranted'] + $hours, 2);
            $roomId = $attribution['salle']['id'];
            $year['rooms'][$roomId] ??= ['id' => $roomId, 'nom' => $attribution['salle']['nom'], 'reservationCount' => 0, 'hours' => 0.0];
            ++$year['rooms'][$roomId]['reservationCount'];
            $year['rooms'][$roomId]['hours'] = round($year['rooms'][$roomId]['hours'] + $hours, 2);
            $year['attributions'][] = $attribution;
            unset($year);

            ++$totals['roomReservationCount'];
            $totals['roomHoursGranted'] = round($totals['roomHoursGranted'] + $hours, 2);
        }

        foreach ($this->equipmentReservations->findGrantedByAssociation($association) as $reservation) {
            $attribution = $this->equipmentAttribution($reservation);
            if (null === $attribution) {
                continue;
            }

            $year = &$this->year($years, (int) substr($attribution['start'], 0, 4));
            ++$year['equipmentReservationCount'];
            foreach ($attribution['lignes'] as $line) {
                $equipmentId = $line['materielId'];
                $year['equipment'][$equipmentId] ??= ['id' => $equipmentId, 'designation' => $line['designation'], 'reservationCount' => 0, 'quantity' => 0];
                ++$year['equipment'][$equipmentId]['reservationCount'];
                $year['equipment'][$equipmentId]['quantity'] += $line['quantite'];
                $year['equipmentQuantity'] += $line['quantite'];
                $totals['equipmentQuantity'] += $line['quantite'];
            }
            $year['attributions'][] = $attribution;
            unset($year);

            ++$totals['equipmentReservationCount'];
        }

        krsort($years);

        return [
            'association' => ['id' => $association->getId(), 'nom' => $association->getNom()],
            'totals' => $totals,
            'years' => array_values(array_map(static function (array $year): array {
                usort($year['attributions'], static fn (array $a, array $b): int => strcmp($b['start'], $a['start']));
                $rooms = array_values($year['rooms']);
                usort($rooms, static fn (array $a, array $b): int => $b['hours'] <=> $a['hours']);
                $equipment = array_values($year['equipment']);
                usort($equipment, static fn (array $a, array $b): int => $b['quantity'] <=> $a['quantity']);

                return [...$year, 'rooms' => $rooms, 'equipment' => $equipment];
            }, $years)),
        ];
    }

    /**
     * @return array{type: 'salle', id: ?int, statut: ?string, motifEvenement: ?string, campagne: ?string, start: string, end: string, hours: float, salle: array{id: int, nom: ?string}}|null
     */
    private function roomAttribution(ReservationSalle $reservation): ?array
    {
        $start = $reservation->getDateDebut();
        $end = $reservation->getDateFin();
        $room = $reservation->getSalle();
        if (null === $start || null === $end || null === $room) {
            return null;
        }

        $season = trim((string) $reservation->getCampaign()?->getSeasonLabel());

        return [
            'type' => 'salle',
            'id' => $reservation->getId(),
            'statut' => $reservation->getStatut(),
            'motifEvenement' => $reservation->getMotifEvenement(),
            'campagne' => '' === $season ? null : $season,
            'start' => $start->format(\DateTimeInterface::ATOM),
            'end' => $end->format(\DateTimeInterface::ATOM),
            'hours' => max(0.0, round(($end->getTimestamp() - $start->getTimestamp()) / 3600, 2)),
            'salle' => ['id' => (int) $room->getId(), 'nom' => $room->getNom()],
        ];
    }

    /**
     * @return array{type: 'materiel', id: ?int, statut: ?string, motifEvenement: ?string, start: string, end: string, lignes: list<array{materielId: int, designation: ?string, quantite: int}>}|null
     */
    private function equipmentAttribution(ReservationMateriel $reservation): ?array
    {
        $start = $reservation->getDateRetrait();
        $end = $reservation->getDateRestitution();
        if (null === $start || null === $end) {
            return null;
        }

        $lines = [];
        foreach ($reservation->getLignes() as $line) {
            $equipment = $line->getMateriel();
            if (null !== $equipment) {
                $lines[] = ['materielId' => (int) $equipment->getId(), 'designation' => $equipment->getDesignation(), 'quantite' => (int) $line->getQuantite()];
            }
        }

        return [
            'type' => 'materiel',
            'id' => $reservation->getId(),
            'statut' => $reservation->getStatut(),
            'motifEvenement' => $reservation->getMotifEvenement(),
            'start' => $start->format(\DateTimeInterface::ATOM),
            'end' => $end->format(\DateTimeInterface::ATOM),
            'lignes' => $lines,
        ];
    }

    /**
     * @param array<int, array<string, mixed>> $years
     *
     * @return array<string, mixed>
     */
    private function &year(array &$years, int $year): array
    {
        $years[$year] ??= [
            'year' => $year,
            'roomReservationCount' => 0,
            'roomHoursGranted' => 0.0,
            'equipmentReservationCount' => 0,
            'equipmentQuantity' => 0,
            'rooms' => [],
            'equipment' => [],
            'attributions' => [],
        ];

        return $years[$year];
    }
}
