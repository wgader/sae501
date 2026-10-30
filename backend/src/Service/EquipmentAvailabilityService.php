<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Materiel;
use App\Repository\MaterielRepository;
use App\Repository\ReservationMaterielRepository;

final class EquipmentAvailabilityService
{
    public function __construct(
        private readonly MaterielRepository $materielRepository,
        private readonly ReservationMaterielRepository $reservationRepository,
    ) {
    }

    /**
     * @return list<array{
     *     id: int|null,
     *     designation: string|null,
     *     categorie: string|null,
     *     description: string|null,
     *     imagePath: string|null,
     *     stockTotal: int|null,
     *     stockEngage: int,
     *     stockDisponible: int
     * }>
     */
    public function getAvailability(string $startValue, string $endValue): array
    {
        $start = $this->parseDate($startValue, 'La date de début est invalide.');
        $end = $this->parseDate($endValue, 'La date de fin est invalide.');

        if ($start < new \DateTimeImmutable()) {
            throw new \InvalidArgumentException('La date de retrait ne peut pas être passée.');
        }

        if ($end <= $start) {
            throw new \InvalidArgumentException(
                'La date de restitution doit être postérieure à la date de retrait.',
            );
        }

        $engagedByEquipment = [];
        foreach ($this->reservationRepository->getEngagedStockByEquipment($start, $end) as $row) {
            $engagedByEquipment[(int) $row['id']] = (int) $row['engagedStock'];
        }

        $availability = [];
        foreach ($this->materielRepository->findAvailableForCatalog() as $equipment) {
            $id = $equipment->getId();
            $stockTotal = $equipment->getStockTotal() ?? 0;
            $stockEngage = $id !== null ? ($engagedByEquipment[$id] ?? 0) : 0;

            $availability[] = [
                'id' => $id,
                'designation' => $equipment->getDesignation(),
                'categorie' => $equipment->getCategorie(),
                'description' => $equipment->getDescription(),
                'imagePath' => $equipment->getImagePath(),
                'stockTotal' => $stockTotal,
                'stockEngage' => $stockEngage,
                'stockDisponible' => max(0, $stockTotal - $stockEngage),
            ];
        }

        return $availability;
    }

    private function parseDate(string $value, string $errorMessage): \DateTimeImmutable
    {
        try {
            return new \DateTimeImmutable($value);
        } catch (\Exception) {
            throw new \InvalidArgumentException($errorMessage);
        }
    }
}
