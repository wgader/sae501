<?php

namespace App\Service;

use App\Entity\Materiel;
use App\Entity\ReservationMateriel;
use App\Entity\ReservationMaterielLigne;
use App\Entity\StockAdjustment;
use App\Entity\User;
use App\Exception\StockConflictException;
use App\Repository\ReservationMaterielRepository;
use Doctrine\ORM\EntityManagerInterface;

final class EquipmentStockService
{
    public function __construct(
        private readonly ReservationMaterielRepository $reservationRepository,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    /**
     * Analyse si une réduction de stock engendre un surbooking sur les réservations futures validées.
     *
     * @return array{
     *     hasConflict: bool,
     *     maxBooked: int,
     *     conflictingReservations: list<array{
     *         id: int,
     *         association: string,
     *         motif: string,
     *         dateRetrait: string,
     *         dateRestitution: string,
     *         quantite: int
     *     }>
     * }
     */
    public function checkStockReductionConflict(Materiel $materiel, int $newStock, ?\DateTimeImmutable $referenceDate = null): array
    {
        if ($materiel->getId() === null) {
            return [
                'hasConflict' => false,
                'maxBooked' => 0,
                'conflictingReservations' => [],
            ];
        }

        $futureReservations = $this->reservationRepository->findFutureValidatedForMateriel($materiel->getId(), $referenceDate);
        $conflicting = [];
        $maxBooked = 0;

        foreach ($futureReservations as $reservation) {
            $qty = 0;
            foreach ($reservation->getLignes() as $ligne) {
                if ($ligne->getMateriel()?->getId() === $materiel->getId()) {
                    $qty += $ligne->getQuantite();
                }
            }

            if ($qty > $maxBooked) {
                $maxBooked = $qty;
            }

            if ($qty > $newStock) {
                $conflicting[] = [
                    'id' => $reservation->getId() ?? 0,
                    'association' => $reservation->getAssociation()?->getNom() ?? 'Association',
                    'motif' => $reservation->getMotifEvenement(),
                    'dateRetrait' => $reservation->getDateRetrait()->format(\DateTimeInterface::ATOM),
                    'dateRestitution' => $reservation->getDateRestitution()->format(\DateTimeInterface::ATOM),
                    'quantite' => $qty,
                ];
            }
        }

        return [
            'hasConflict' => !empty($conflicting),
            'maxBooked' => $maxBooked,
            'conflictingReservations' => $conflicting,
        ];
    }

    /**
     * Ajuste le stock total en appliquant les règles de cohérence.
     *
     * @throws StockConflictException Si le stock passe sous le seuil d'une réservation validée sans confirmation explicite.
     * @throws \InvalidArgumentException Si le stock est négatif.
     */
    public function adjustStock(
        Materiel $materiel,
        int $newStock,
        string $reason,
        User $agent,
        bool $force = false,
    ): void
    {
        if ($newStock < 0) {
            throw new \InvalidArgumentException('Le stock doit être un entier positif ou nul.');
        }

        $check = $this->checkStockReductionConflict($materiel, $newStock);
        if ($check['hasConflict'] && !$force) {
            throw new StockConflictException(
                sprintf(
                    'Le nouveau stock (%d) est inférieur au volume réservé sur des périodes futures (jusqu\'à %d unités requises).',
                    $newStock,
                    $check['maxBooked']
                ),
                $check['conflictingReservations'],
                $check['maxBooked']
            );
        }

        $previousStock = $materiel->getStockTotal();
        if ($previousStock === null) {
            throw new \LogicException('Le stock actuel du matériel est invalide.');
        }

        $materiel->setStockTotal($newStock);
        $this->entityManager->persist(new StockAdjustment(
            $materiel,
            $agent,
            $previousStock,
            $newStock,
            $reason,
        ));
        $this->entityManager->flush();
    }

    /**
     * Archive un matériel (Soft Delete).
     * Maintient les liens avec les réservations existantes.
     */
    public function archive(Materiel $materiel): void
    {
        $materiel->setIsArchived(true);
        $this->entityManager->flush();
    }
}
