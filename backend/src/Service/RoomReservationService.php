<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Association;
use App\Entity\Campaign;
use App\Entity\DemandeStatusHistory;
use App\Entity\DocumentJustificatif;
use App\Entity\ReservationSalle;
use App\Entity\Salle;
use App\Entity\User;
use App\Exception\RoomBookingClosedException;
use App\Exception\RoomReservationConflictException;
use App\Message\SendRoomReservationNotificationMessage;
use App\Repository\CampaignRepository;
use App\Repository\ReservationSalleRepository;
use Doctrine\DBAL\LockMode;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\Messenger\MessageBusInterface;

final class RoomReservationService
{
    public const OPENING_HOUR = 8;
    public const CLOSING_HOUR = 23;

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly PrivateDocumentStorage $documentStorage,
        private readonly ReservationSalleRepository $reservationSalleRepository,
        private readonly MessageBusInterface $messageBus,
        private readonly CampaignRepository $campaignRepository,
        private readonly CampaignService $campaignService,
    ) {
    }

    /**
     * Crée une demande de salle avec verrouillage transactionnel.
     *
     * - Demande de campagne : seulement pendant la campagne ouverte et sur sa période réservable ;
     *   plusieurs associations peuvent viser le même créneau, la réunion d’arbitrage tranche.
     * - Réservation ponctuelle : hors campagne ouverte et hors période d’une campagne à venir ;
     *   premier arrivé, premier servi, le créneau est bloqué dès le dépôt.
     */
    public function create(
        Association $association,
        User $user,
        int $salleId,
        string $motif,
        \DateTimeImmutable $dateDebut,
        \DateTimeImmutable $dateFin,
        ?int $capaciteAttendue = null,
        ?UploadedFile $justificatif = null,
        bool $forCampaign = false,
    ): ReservationSalle {
        $campaign = $this->resolveCampaign($dateDebut, $forCampaign);

        $storedJustificatifPath = null;

        try {
            $reservation = $this->entityManager->wrapInTransaction(function () use (
                $association,
                $user,
                $campaign,
                $salleId,
                $motif,
                $dateDebut,
                $dateFin,
                $capaciteAttendue,
                $justificatif,
                &$storedJustificatifPath,
            ): ReservationSalle {
                // 1. Verrouillage pessimiste de la salle pour sérialiser les réservations concurrentes
                /** @var Salle|null $salle */
                $salle = $this->entityManager->find(Salle::class, $salleId, LockMode::PESSIMISTIC_WRITE);
                if ($salle === null) {
                    throw new \InvalidArgumentException('La salle demandée est introuvable.');
                }

                if (!$salle->isActive() || $salle->getDeletedAt() !== null) {
                    throw new \InvalidArgumentException('La salle sélectionnée n’est pas disponible à la réservation.');
                }

                // 2. Validation des contraintes temporelles
                $now = new \DateTimeImmutable();
                if ($dateDebut < $now) {
                    throw new \InvalidArgumentException('La réservation ne peut pas être effectuée dans le passé.');
                }

                if ($dateFin <= $dateDebut) {
                    throw new \InvalidArgumentException('L’heure de fin doit être strictement postérieure à l’heure de début.');
                }

                $this->validateOpeningHours($dateDebut, $dateFin);

                // 3. Validation du motif
                $cleanMotif = trim($motif);
                if ($cleanMotif === '') {
                    throw new \InvalidArgumentException('Le motif de l’événement est obligatoire.');
                }

                // 4. Validation de la capacité
                if ($capaciteAttendue !== null) {
                    if ($capaciteAttendue <= 0) {
                        throw new \InvalidArgumentException('L’effectif attendu doit être strictement supérieur à zéro.');
                    }

                    if ($capaciteAttendue > $salle->getCapaciteMax()) {
                        throw new \InvalidArgumentException(sprintf(
                            'L’effectif attendu (%d personnes) dépasse la capacité maximale déclarée de la salle (%d personnes).',
                            $capaciteAttendue,
                            $salle->getCapaciteMax(),
                        ));
                    }
                }

                // 5. Contrôle strict de non-chevauchement (Overlap Prevention)
                $conflicts = $this->reservationSalleRepository->findOverlappingReservations($salle, $dateDebut, $dateFin);
                if (null !== $campaign) {
                    // Les demandes concurrentes de la même campagne sont arbitrées en réunion :
                    // seuls bloquent un créneau déjà attribué ou une réservation ponctuelle.
                    $conflicts = array_values(array_filter(
                        $conflicts,
                        static fn (ReservationSalle $r): bool => $r->getCampaign()?->getId() !== $campaign->getId()
                            || CampaignRequestService::STATUS_ACCEPTED === $r->getStatut(),
                    ));
                }
                if ($conflicts !== []) {
                    $conflictDetails = array_map(static fn (ReservationSalle $r): array => [
                        'id' => $r->getId(),
                        'start' => $r->getDateDebut()?->format(\DateTimeInterface::ATOM),
                        'end' => $r->getDateFin()?->format(\DateTimeInterface::ATOM),
                        'statut' => $r->getStatut(),
                    ], $conflicts);

                    throw new RoomReservationConflictException(
                        "Ce créneau horaire vient d'être réservé par un autre usager ou chevauche une réservation existante. Veuillez actualiser le calendrier et choisir un autre créneau.",
                        $conflictDetails,
                    );
                }

                // 6. Enregistrement de la réservation
                $reservation = new ReservationSalle();
                $reservation->setAssociation($association);
                $reservation->setSalle($salle);
                $reservation->setMotifEvenement($cleanMotif);
                $reservation->setDateDebut($dateDebut);
                $reservation->setDateFin($dateFin);
                $reservation->setCapaciteAttendue($capaciteAttendue);
                $reservation->setStatut('En attente de validation par la mairie');
                // Une demande de campagne apparaît dans son suivi ; sans campagne, elle est ponctuelle.
                $reservation->setCampaign($campaign);
                $reservation->setCreatedAt(new \DateTimeImmutable());

                $this->entityManager->persist($reservation);
                $this->entityManager->flush();

                // 7. Journalisation dans l'historique des démarches
                $history = new DemandeStatusHistory(
                    'salle',
                    $reservation->getId() ?? 0,
                    'En attente de validation par la mairie',
                    'Demande de réservation déposée',
                    'Demande enregistrée en attente de validation par la mairie.',
                    trim($user->getPrenom() . ' ' . $user->getNom()),
                );
                $this->entityManager->persist($history);

                // 8. Gestion de la pièce justificative optionnelle
                if ($justificatif instanceof UploadedFile) {
                    $storedJustificatifPath = $this->storeJustificatif($justificatif, $association, $reservation->getId() ?? 0);
                }

                $this->entityManager->flush();

                return $reservation;
            });
        } catch (\Throwable $exception) {
            // Sans réservation enregistrée, la pièce stockée ne serait jamais rattachée ni supprimée.
            if (null !== $storedJustificatifPath) {
                $this->documentStorage->delete($storedJustificatifPath);
            }

            throw $exception;
        }

        // 9. Déclenchement du traitement asynchrone des emails
        try {
            if ($reservation->getId() !== null) {
                $this->messageBus->dispatch(new SendRoomReservationNotificationMessage($reservation->getId()));
            }
        } catch (\Throwable) {
            // Ne fait pas échouer la création si le bus est temporairement indisponible
        }

        return $reservation;
    }

    private function resolveCampaign(\DateTimeImmutable $slotStart, bool $forCampaign): ?Campaign
    {
        $now = new \DateTimeImmutable();
        $this->campaignService->synchronize($now);
        $active = $this->campaignRepository->findCurrent($now, 'salle');

        if ($forCampaign) {
            if (null === $active) {
                throw new RoomBookingClosedException();
            }
            if (!$active->coversDay($slotStart)) {
                throw new \InvalidArgumentException(\sprintf(
                    'Ce jour est en dehors de la période réservable de la campagne (du %s au %s).',
                    $active->getPeriodStart()?->format('d/m/Y'),
                    $active->getPeriodEnd()?->format('d/m/Y'),
                ));
            }

            return $active;
        }

        if (null !== $active) {
            throw new RoomBookingClosedException(
                \sprintf('La campagne « %s » est ouverte : déposez vos demandes depuis la page Campagne.', $active->getSeasonLabel()),
                RoomBookingClosedException::ONE_OFF_CLOSED,
            );
        }

        foreach ($this->campaignRepository->findBy(['status' => Campaign::STATUS_PROGRAMMED]) as $upcoming) {
            if (
                null !== $upcoming->getPeriodStart()
                && \in_array('salle', $upcoming->getResourceTypes(), true)
                && $upcoming->coversDay($slotStart)
            ) {
                throw new RoomBookingClosedException(
                    \sprintf('Ce jour sera attribué lors de la campagne « %s » : il ne peut pas être réservé ponctuellement.', $upcoming->getSeasonLabel()),
                    RoomBookingClosedException::SLOT_IN_CAMPAIGN,
                );
            }
        }

        return null;
    }

    private function validateOpeningHours(\DateTimeImmutable $start, \DateTimeImmutable $end): void
    {
        // Même jour civil obligatoire
        if ($start->format('Y-m-d') !== $end->format('Y-m-d')) {
            throw new \InvalidArgumentException('La réservation doit s’effectuer sur une même journée civile.');
        }

        $startHour = (int) $start->format('H');
        $endHour = (int) $end->format('H');
        $endMin = (int) $end->format('i');

        if ($startHour < self::OPENING_HOUR) {
            throw new \InvalidArgumentException(sprintf(
                'La salle n’ouvre qu’à %02dh00. Veuillez choisir un horaire de début valide.',
                self::OPENING_HOUR,
            ));
        }

        if ($endHour === self::CLOSING_HOUR && $endMin > 0) {
            throw new \InvalidArgumentException(sprintf(
                'La salle ferme à %02dh00. Veuillez choisir un horaire de fin valide.',
                self::CLOSING_HOUR,
            ));
        }
    }

    private function storeJustificatif(UploadedFile $file, Association $association, int $reservationId): string
    {
        $storedFile = $this->documentStorage->store($file);

        $doc = new DocumentJustificatif();
        $doc->setAssociation($association);
        $doc->setTypeDocument('Attestation d’assurance / Pièce justificative');
        $doc->setFichierUrl($storedFile['path']);
        $doc->setLieAType('salle');
        $doc->setLieAId($reservationId);
        $doc->setDescription(json_encode([
            'verified' => false,
            'size' => $storedFile['size'],
            'originalName' => $storedFile['originalName'],
            'mimeType' => $storedFile['mimeType'],
        ], JSON_THROW_ON_ERROR));

        $this->entityManager->persist($doc);

        return $storedFile['path'];
    }
}
