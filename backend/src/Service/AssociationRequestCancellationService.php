<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Association;
use App\Entity\Campaign;
use App\Entity\DemandeStatusHistory;
use App\Entity\ReservationMateriel;
use App\Entity\ReservationSalle;
use App\Entity\User;
use App\Repository\ReservationMaterielRepository;
use App\Repository\ReservationSalleRepository;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Annulation d’une réservation par l’association ou par la mairie, historisée et notifiée
 * aux deux parties.
 */
final class AssociationRequestCancellationService
{
    private const CANCELLABLE_STATUSES = [
        'En attente de validation par la mairie',
        'En attente',
        'En cours de traitement',
        'Complément requis',
        'Validée',
    ];

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly ReservationMaterielRepository $materielRepository,
        private readonly ReservationSalleRepository $salleRepository,
        private readonly RequestCancellationNotifier $notifier,
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

        // Après la clôture, le planning de la campagne est figé pour l’arbitrage : seule la mairie le modifie.
        if ($reservation instanceof ReservationSalle && Campaign::STATUS_CLOSED === $reservation->getCampaign()?->getStatus()) {
            throw new \DomainException('La campagne est clôturée : contactez la mairie pour modifier ou annuler cette demande.');
        }

        $this->assertCancellable($reservation);

        return $this->apply(
            $reservation,
            $type,
            'Réservation annulée par l’association',
            'La réservation a été annulée depuis l’espace association.',
            'Association',
            RequestCancellationNotifier::BY_ASSOCIATION,
            null,
        );
    }

    /**
     * Annulation décidée par la mairie, possible à tout moment, y compris après la clôture d’une campagne.
     */
    public function cancelByTownHall(ReservationSalle $reservation, User $agent, ?string $reason): ReservationSalle
    {
        $this->assertCancellable($reservation);
        $reason = null === $reason ? null : trim($reason);
        if (null !== $reason && mb_strlen($reason) > 1000) {
            throw new \InvalidArgumentException('Le motif ne peut pas dépasser 1000 caractères.');
        }
        $reason = '' === $reason ? null : $reason;
        $reservation->setDecisionComment($reason);

        $this->apply(
            $reservation,
            AssociationRequestAggregationService::TYPE_SALLE,
            'Réservation annulée par la mairie',
            $reason ?? 'La mairie a annulé la réservation.',
            trim(($agent->getPrenom() ?? '').' '.($agent->getNom() ?? '')),
            RequestCancellationNotifier::BY_TOWN_HALL,
            $reason,
        );

        return $reservation;
    }

    private function assertCancellable(ReservationMateriel|ReservationSalle $reservation): void
    {
        if (!in_array($reservation->getStatut(), self::CANCELLABLE_STATUSES, true)) {
            throw new \DomainException('Cette réservation ne peut plus être annulée.');
        }
    }

    private function apply(
        ReservationMateriel|ReservationSalle $reservation,
        string $type,
        string $title,
        string $comment,
        string $author,
        string $cancelledBy,
        ?string $reason,
    ): ReservationMateriel|ReservationSalle {
        $reservation->setStatut('Annulée');
        $reservation->setUpdatedAt(new \DateTimeImmutable());

        $this->entityManager->persist(new DemandeStatusHistory($type, (int) $reservation->getId(), 'Annulée', $title, $comment, $author));
        $this->notifier->notify($reservation, $cancelledBy, $reason);
        $this->entityManager->flush();

        return $reservation;
    }
}
