<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Association;
use App\Entity\DemandeStatusHistory;
use App\Entity\DocumentJustificatif;
use App\Entity\ReservationSalle;
use App\Entity\Salle;
use App\Entity\User;
use App\Exception\RoomReservationConflictException;
use App\Message\SendRoomReservationNotificationMessage;
use App\Repository\ReservationSalleRepository;
use Doctrine\DBAL\LockMode;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\Messenger\MessageBusInterface;

final class RoomReservationService
{
    public const OPENING_HOUR = 8;
    public const CLOSING_HOUR = 23;

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly ReservationSalleRepository $reservationSalleRepository,
        private readonly MessageBusInterface $messageBus,
        #[Autowire('%kernel.project_dir%')]
        private readonly string $projectDir,
    ) {
    }

    /**
     * Crée une réservation de salle avec verrouillage transactionnel et contrôle d'anti-chevauchement strict.
     */
    public function create(
        Association $association,
        User $user,
        int $salleId,
        ?string $motif,
        \DateTimeImmutable $dateDebut,
        \DateTimeImmutable $dateFin,
        ?int $capaciteAttendue = null,
        ?UploadedFile $justificatif = null,
    ): ReservationSalle {
        $reservation = $this->entityManager->wrapInTransaction(function () use (
            $association,
            $user,
            $salleId,
            $motif,
            $dateDebut,
            $dateFin,
            $capaciteAttendue,
            $justificatif,
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

            // 3. Validation de la capacité
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

            // 4. Contrôle strict de non-chevauchement (Overlap Prevention)
            $conflicts = $this->reservationSalleRepository->findOverlappingReservations($salle, $dateDebut, $dateFin);
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

            // 5. Enregistrement de la réservation
            $reservation = new ReservationSalle();
            $reservation->setAssociation($association);
            $reservation->setSalle($salle);
            $reservation->setMotifEvenement($motif);
            $reservation->setDateDebut($dateDebut);
            $reservation->setDateFin($dateFin);
            $reservation->setCapaciteAttendue($capaciteAttendue);
            $reservation->setStatut('En attente de validation par la mairie');
            $reservation->setCreatedAt(new \DateTimeImmutable());

            $this->entityManager->persist($reservation);
            $this->entityManager->flush();

            // 6. Journalisation dans l'historique des démarches
            $history = new DemandeStatusHistory(
                'salle',
                $reservation->getId() ?? 0,
                'En attente de validation par la mairie',
                'Demande de réservation déposée',
                'Demande enregistrée en attente de validation par la mairie.',
                trim($user->getPrenom() . ' ' . $user->getNom()),
            );
            $this->entityManager->persist($history);

            // 7. Gestion de la pièce justificative optionnelle
            if ($justificatif instanceof UploadedFile) {
                $this->storeJustificatif($justificatif, $association, $reservation->getId() ?? 0);
            }

            $this->entityManager->flush();

            return $reservation;
        });

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

    private function validateOpeningHours(\DateTimeImmutable $start, \DateTimeImmutable $end): void
    {
        $startHour = (int) $start->format('H');
        $endHour = (int) $end->format('H');
        $endMin = (int) $end->format('i');

        if ($startHour < self::OPENING_HOUR) {
            throw new \InvalidArgumentException(sprintf(
                'La salle n’ouvre qu’à %02dh00. Veuillez choisir un horaire de début valide.',
                self::OPENING_HOUR,
            ));
        }

        if ($endHour > self::CLOSING_HOUR || ($endHour === self::CLOSING_HOUR && $endMin > 0)) {
            throw new \InvalidArgumentException(sprintf(
                'La salle ferme à %02dh00. Veuillez choisir un horaire de fin valide.',
                self::CLOSING_HOUR,
            ));
        }
    }

    private function storeJustificatif(UploadedFile $file, Association $association, int $reservationId): void
    {
        $allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
        $mime = $file->getMimeType() ?? '';
        if (!in_array($mime, $allowedMimes, true)) {
            throw new \InvalidArgumentException('Format de pièce justificative non supporté (PDF, JPEG, PNG, WEBP uniquement).');
        }

        if ($file->getSize() > 10 * 1024 * 1024) {
            throw new \InvalidArgumentException('La taille du fichier ne doit pas dépasser 10 Mo.');
        }

        $ext = $file->guessExtension() ?? 'bin';
        $filename = sprintf('justificatif_salle_%d_%s.%s', $reservationId, bin2hex(random_bytes(6)), $ext);
        $targetDir = $this->projectDir . '/public/uploads/documents';
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0775, true);
        }

        $originalName = $file->getClientOriginalName();
        $fileSize = $file->getSize();
        $file->move($targetDir, $filename);

        $doc = new DocumentJustificatif();
        $doc->setAssociation($association);
        $doc->setTypeDocument('Attestation d’assurance / Pièce justificative');
        $doc->setFichierUrl('/uploads/documents/' . $filename);
        $doc->setLieAType('salle');
        $doc->setLieAId($reservationId);
        $doc->setDescription(json_encode([
            'verified' => false,
            'size' => $fileSize,
            'originalName' => $originalName,
            'mimeType' => $mime,
        ], JSON_THROW_ON_ERROR));

        $this->entityManager->persist($doc);
    }
}

