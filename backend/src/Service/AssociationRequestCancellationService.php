<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Association;
use App\Entity\DemandeStatusHistory;
use App\Entity\ReservationMateriel;
use App\Entity\ReservationSalle;
use App\Repository\ReservationMaterielRepository;
use App\Repository\ReservationSalleRepository;
use Doctrine\ORM\EntityManagerInterface;

final class AssociationRequestCancellationService
{
    private const CANCELLABLE_STATUSES = [
        'En attente',
        'En cours de traitement',
        'Validée',
    ];

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly ReservationMaterielRepository $materielRepository,
        private readonly ReservationSalleRepository $salleRepository,
    ) {
    }

    public function cancel(
        Association $association,
        string $type,
        int $id,
    ): ReservationMateriel|ReservationSalle {
        $reservation = match ($type) {
            AssociationRequestAggregationService::TYPE_MATERIEL => $this->materielRepository->find($id),
            AssociationRequestAggregationService::TYPE_SALLE => $this->salleRepository->find($id),
            default => null,
        };

        if (!$reservation instanceof ReservationMateriel && !$reservation instanceof ReservationSalle) {
            throw new \OutOfBoundsException('Réservation introuvable.');
        }

        if ($reservation->getAssociation()?->getId() !== $association->getId()) {
            throw new \LogicException('Cette réservation n’appartient pas à votre association.');
        }

        if (!in_array($reservation->getStatut(), self::CANCELLABLE_STATUSES, true)) {
            throw new \DomainException('Cette réservation ne peut plus être annulée.');
        }

        $reservation->setStatut('Annulée');
        $reservation->setUpdatedAt(new \DateTimeImmutable());

        $history = new DemandeStatusHistory(
            $type,
            $id,
            'Annulée',
            'Réservation annulée par l’association',
            'La réservation a été annulée depuis votre espace association.',
            'Association',
        );

        $this->entityManager->persist($history);
        $this->entityManager->flush();

        return $reservation;
    }
}
