<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Association;
use App\Entity\Campaign;
use App\Entity\DemandeStatusHistory;
use App\Entity\ReservationSalle;
use App\Entity\Salle;
use App\Entity\User;
use App\Exception\RoomReservationConflictException;
use App\Repository\ReservationSalleRepository;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Traitement par la mairie des demandes de salle d’une campagne annuelle : acceptation, refus
 * motivé, déplacement (salle, jour, horaire) et ajout direct d’un créneau à une association.
 * Chaque décision est historisée et notifiée à l’association (application et e-mail).
 */
final class CampaignRequestService
{
    public const STATUS_PENDING = 'En attente de validation par la mairie';
    public const STATUS_ACCEPTED = 'Validée';
    public const STATUS_REFUSED = 'Refusée';

    private const SLOT_FORMAT = 'Y-m-d\\TH:i:s';

    /** Statuts sur lesquels la mairie ne revient plus depuis la campagne. */
    private const FINAL_STATUSES = ['Annulée', 'Clôturée'];

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly ReservationSalleRepository $reservationRepository,
        private readonly RoomReservationDecisionNotifier $notifier,
        private readonly AppSettingsService $settings,
    ) {
    }

    /**
     * @return list<ReservationSalle>
     */
    public function listRequests(Campaign $campaign): array
    {
        return $this->reservationRepository->findBy(['campaign' => $campaign], ['dateDebut' => 'ASC']);
    }

    public function accept(ReservationSalle $reservation, User $agent): ReservationSalle
    {
        $this->assertEditable($reservation);
        $this->assertNoConflict($reservation->getSalle(), $reservation->getDateDebut(), $reservation->getDateFin(), $reservation->getId());

        $reservation->setStatut(self::STATUS_ACCEPTED)->setDecisionComment(null);

        return $this->record($reservation, $agent, 'Demande acceptée', 'La mairie a accepté la demande.', RoomReservationDecisionNotifier::DECISION_ACCEPTED);
    }

    public function refuse(ReservationSalle $reservation, User $agent, ?string $reason): ReservationSalle
    {
        $this->assertEditable($reservation);
        $reservation->setStatut(self::STATUS_REFUSED)->setDecisionComment($this->cleanReason($reason));

        return $this->record(
            $reservation,
            $agent,
            'Demande refusée',
            $reservation->getDecisionComment() ?? 'La mairie a refusé la demande.',
            RoomReservationDecisionNotifier::DECISION_REFUSED,
        );
    }

    /**
     * Déplace la demande sur une autre salle et/ou un autre créneau ; elle est alors acceptée.
     */
    public function reschedule(
        ReservationSalle $reservation,
        User $agent,
        Salle $salle,
        \DateTimeImmutable $start,
        \DateTimeImmutable $end,
        ?string $reason,
    ): ReservationSalle {
        $this->assertEditable($reservation);
        $this->assertSlot($salle, $start, $end, $reservation->getCapaciteAttendue());
        $this->assertNoConflict($salle, $start, $end, $reservation->getId());

        $reservation
            ->setSalle($salle)
            ->setDateDebut($start)
            ->setDateFin($end)
            ->setStatut(self::STATUS_ACCEPTED)
            ->setDecisionComment($this->cleanReason($reason));

        return $this->record(
            $reservation,
            $agent,
            'Demande modifiée et acceptée',
            \sprintf('Créneau attribué : %s, le %s de %s à %s.', $salle->getNom(), $start->format('d/m/Y'), $start->format('H\hi'), $end->format('H\hi')),
            RoomReservationDecisionNotifier::DECISION_RESCHEDULED,
        );
    }

    /**
     * Ajoute un créneau pour une association, rattaché à la campagne et en attente comme les
     * autres demandes : il peut chevaucher d’autres demandes, la réunion d’arbitrage tranche.
     */
    public function addSlot(
        Campaign $campaign,
        User $agent,
        Association $association,
        Salle $salle,
        \DateTimeImmutable $start,
        \DateTimeImmutable $end,
        string $motif,
    ): ReservationSalle {
        $motif = trim($motif);
        if ('' === $motif) {
            throw new \InvalidArgumentException('Le motif du créneau est obligatoire.');
        }
        if (mb_strlen($motif) > 255) {
            throw new \InvalidArgumentException('Le motif ne peut pas dépasser 255 caractères.');
        }
        if ('VALIDATED' !== $association->getStatut()) {
            throw new \InvalidArgumentException('Un créneau ne peut être attribué qu’à une association validée.');
        }
        $this->assertSlot($salle, $start, $end, null);

        $reservation = (new ReservationSalle())
            ->setAssociation($association)
            ->setSalle($salle)
            ->setCampaign($campaign)
            ->setMotifEvenement($motif)
            ->setDateDebut($start)
            ->setDateFin($end)
            ->setStatut(self::STATUS_PENDING)
            ->setCreatedAt(new \DateTimeImmutable());
        $this->entityManager->persist($reservation);
        // L’identifiant est nécessaire à l’historique.
        $this->entityManager->flush();

        return $this->record(
            $reservation,
            $agent,
            'Créneau proposé par la mairie',
            \sprintf('%s, le %s de %s à %s.', $salle->getNom(), $start->format('d/m/Y'), $start->format('H\hi'), $end->format('H\hi')),
            RoomReservationDecisionNotifier::DECISION_ADDED,
        );
    }

    /**
     * Prévient chaque association concernée que sa demande est en concurrence avec d’autres sur
     * le même créneau : elle sera départagée lors de la réunion d’arbitrage.
     *
     * @return list<ReservationSalle> demandes dont l’association a été prévenue
     */
    public function notifyConflict(ReservationSalle $reservation, User $agent): array
    {
        $campaign = $reservation->getCampaign();
        $siblings = null === $campaign ? [] : $this->listRequests($campaign);
        $ids = self::overlappingIds($reservation, $siblings);
        if ([] === $ids || 'pending' !== self::statusKey($reservation->getStatut())) {
            throw new \DomainException('Cette demande n’est en concurrence avec aucune autre demande en cours.');
        }

        $group = [$reservation, ...array_values(array_filter($siblings, static fn (ReservationSalle $r): bool => \in_array($r->getId(), $ids, true)))];
        foreach ($group as $request) {
            $this->entityManager->persist(new DemandeStatusHistory(
                'salle',
                (int) $request->getId(),
                $request->getStatut(),
                'Créneau demandé par plusieurs associations',
                'La demande sera départagée lors de la réunion d’arbitrage.',
                trim(($agent->getPrenom() ?? '').' '.($agent->getNom() ?? '')),
            ));
            $this->notifier->notify($request, RoomReservationDecisionNotifier::DECISION_CONFLICT);
        }
        $this->entityManager->flush();

        return $group;
    }

    private function record(ReservationSalle $reservation, User $agent, string $title, string $comment, string $decision): ReservationSalle
    {
        $reservation->setUpdatedAt(new \DateTimeImmutable());
        $this->entityManager->persist(new DemandeStatusHistory(
            'salle',
            $reservation->getId() ?? 0,
            $reservation->getStatut(),
            $title,
            $comment,
            trim(($agent->getPrenom() ?? '').' '.($agent->getNom() ?? '')),
        ));
        $this->notifier->notify($reservation, $decision);
        $this->entityManager->flush();

        return $reservation;
    }

    private function assertEditable(ReservationSalle $reservation): void
    {
        if (\in_array($reservation->getStatut(), self::FINAL_STATUSES, true)) {
            throw new \DomainException('Cette demande est annulée ou clôturée : elle ne peut plus être modifiée.');
        }
    }

    private function assertSlot(Salle $salle, \DateTimeImmutable $start, \DateTimeImmutable $end, ?int $expectedCapacity): void
    {
        if (!$salle->isActive() || null !== $salle->getDeletedAt()) {
            throw new \InvalidArgumentException('La salle sélectionnée n’est pas disponible à la réservation.');
        }
        if ($end <= $start) {
            throw new \InvalidArgumentException('L’heure de fin doit être postérieure à l’heure de début.');
        }
        if ($start->format('Y-m-d') !== $end->format('Y-m-d')) {
            throw new \InvalidArgumentException('Le créneau doit tenir sur une même journée.');
        }
        $startHour = (int) $start->format('G');
        $endMinutes = (int) $end->format('G') * 60 + (int) $end->format('i');
        $settings = $this->settings->current();
        if ($startHour < $settings->getRoomOpeningHour() || $endMinutes > $settings->getRoomClosingHour() * 60) {
            throw new \InvalidArgumentException(\sprintf('Les salles sont ouvertes de %dh à %dh.', $settings->getRoomOpeningHour(), $settings->getRoomClosingHour()));
        }
        if (null !== $expectedCapacity && null !== $salle->getCapaciteMax() && $expectedCapacity > $salle->getCapaciteMax()) {
            throw new \InvalidArgumentException(\sprintf('L’effectif attendu (%d personnes) dépasse la capacité de cette salle (%d personnes).', $expectedCapacity, $salle->getCapaciteMax()));
        }
    }

    private function assertNoConflict(?Salle $salle, ?\DateTimeImmutable $start, ?\DateTimeImmutable $end, ?int $excludeId): void
    {
        if (null === $salle || null === $start || null === $end) {
            throw new \InvalidArgumentException('La demande est incomplète (salle ou créneau manquant).');
        }

        $conflicts = $this->reservationRepository->findAcceptedOverlaps($salle, $start, $end, $excludeId);
        if ([] === $conflicts) {
            return;
        }

        throw new RoomReservationConflictException('Ce créneau chevauche une réservation déjà acceptée dans cette salle.', array_map(static fn (ReservationSalle $r): array => ['id' => $r->getId(), 'association' => $r->getAssociation()?->getNom(), 'start' => $r->getDateDebut()?->format(\DateTimeInterface::ATOM), 'end' => $r->getDateFin()?->format(\DateTimeInterface::ATOM), 'statut' => $r->getStatut()], $conflicts));
    }

    private function cleanReason(?string $reason): ?string
    {
        $reason = null === $reason ? null : trim($reason);
        if (null !== $reason && mb_strlen($reason) > 1000) {
            throw new \InvalidArgumentException('Le message ne peut pas dépasser 1000 caractères.');
        }

        return '' === $reason ? null : $reason;
    }

    /**
     * Clé de décision exposée au frontend et au planning : pending, accepted, refused ou closed.
     */
    public static function statusKey(string $statut): string
    {
        return match ($statut) {
            self::STATUS_ACCEPTED => 'accepted',
            self::STATUS_REFUSED => 'refused',
            'Annulée', 'Clôturée' => 'closed',
            default => 'pending',
        };
    }

    /**
     * @param list<ReservationSalle> $siblings
     *
     * @return list<int>
     */
    public static function overlappingIds(ReservationSalle $reservation, array $siblings): array
    {
        if ('refused' === self::statusKey($reservation->getStatut())) {
            return [];
        }

        $ids = [];
        foreach ($siblings as $other) {
            if (
                $other === $reservation
                || \in_array(self::statusKey($other->getStatut()), ['refused', 'closed'], true)
                || $other->getSalle()?->getId() !== $reservation->getSalle()?->getId()
                || $other->getDateDebut() >= $reservation->getDateFin()
                || $other->getDateFin() <= $reservation->getDateDebut()
            ) {
                continue;
            }
            $ids[] = (int) $other->getId();
        }

        return $ids;
    }

    /**
     * Représentation d’une demande de salle pour la mairie et l’association. Les créneaux sont des
     * heures locales sans décalage horaire.
     *
     * @param list<ReservationSalle> $siblings demandes voisines, pour signaler les chevauchements
     *
     * @return array<string, mixed>
     */
    public static function serialize(ReservationSalle $reservation, array $siblings = []): array
    {
        $association = $reservation->getAssociation();
        $salle = $reservation->getSalle();

        return [
            'id' => $reservation->getId(),
            'status' => self::statusKey($reservation->getStatut()),
            'statusLabel' => $reservation->getStatut(),
            'campaignId' => $reservation->getCampaign()?->getId(),
            'association' => ['id' => $association?->getId(), 'nom' => $association?->getNom()],
            'salle' => ['id' => $salle?->getId(), 'nom' => $salle?->getNom(), 'capaciteMax' => $salle?->getCapaciteMax()],
            'motifEvenement' => $reservation->getMotifEvenement(),
            'capaciteAttendue' => $reservation->getCapaciteAttendue(),
            'dateDebut' => $reservation->getDateDebut()?->format(self::SLOT_FORMAT),
            'dateFin' => $reservation->getDateFin()?->format(self::SLOT_FORMAT),
            'decisionComment' => $reservation->getDecisionComment(),
            'createdAt' => $reservation->getCreatedAt()?->format(\DateTimeInterface::ATOM),
            'updatedAt' => $reservation->getUpdatedAt()?->format(\DateTimeInterface::ATOM),
            'conflictsWith' => self::overlappingIds($reservation, $siblings),
        ];
    }
}
