<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\ReservationMateriel;
use Doctrine\ORM\EntityManagerInterface;

final class EquipmentReservationAdministrationService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly EquipmentReservationStatusNotifier $statusNotifier,
    ) {
    }

    public function updateStatus(ReservationMateriel $reservation, string $status, ?string $noteInterne = null): ReservationMateriel
    {
        if (!in_array($status, ['Validée', 'Refusée'], true)) {
            throw new \InvalidArgumentException('Le statut demandé est invalide.');
        }

        if ($reservation->getStatut() !== 'En attente') {
            throw new \DomainException('Seules les demandes en attente peuvent être traitées.');
        }

        $reservation->setStatut($status);
        $reservation->setNoteInterne($noteInterne !== null ? trim($noteInterne) : $reservation->getNoteInterne());
        $reservation->setUpdatedAt(new \DateTimeImmutable());
        $this->entityManager->flush();

        $this->statusNotifier->notifyDecision($reservation);

        return $reservation;
    }
}
