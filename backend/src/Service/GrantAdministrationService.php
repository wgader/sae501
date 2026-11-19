<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\DemandeSubvention;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Décision de la mairie sur un dossier de subvention transmis.
 */
final class GrantAdministrationService
{
    /** Statuts d'un dossier qui attend une décision (« En cours de traitement » vient des anciennes données). */
    public const PENDING_STATUSES = ['En attente', 'En cours de traitement'];

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly GrantStatusNotifier $statusNotifier,
    ) {
    }

    public function decide(DemandeSubvention $grant, string $status, mixed $grantedAmount, mixed $message): DemandeSubvention
    {
        if (!in_array($status, ['Validée', 'Refusée'], true)) {
            throw new \InvalidArgumentException('La décision doit être « Validée » ou « Refusée ».');
        }
        if (!in_array($grant->getStatut(), self::PENDING_STATUSES, true)) {
            throw new \DomainException('Seuls les dossiers en attente peuvent être instruits.');
        }

        $message = is_string($message) ? trim($message) : '';
        if (mb_strlen($message) > 2000) {
            throw new \InvalidArgumentException('Le message ne peut pas dépasser 2 000 caractères.');
        }

        if ('Validée' === $status) {
            $requested = self::toCents((string) $grant->getMontantDemande());
            // Sans montant saisi, la mairie accorde la somme demandée.
            $granted = null === $grantedAmount || '' === $grantedAmount ? $requested : self::toCents($grantedAmount);
            if ($granted <= 0 || $granted > $requested) {
                throw new \InvalidArgumentException('Le montant accordé doit être positif et ne pas dépasser le montant demandé.');
            }
            $grant->setMontantAccorde(sprintf('%d.%02d', intdiv($granted, 100), $granted % 100));
        } else {
            if ('' === $message) {
                throw new \InvalidArgumentException('Indiquez le motif du refus à l’association.');
            }
            $grant->setMontantAccorde(null);
        }

        $grant
            ->setStatut($status)
            ->setObservations('' === $message ? null : $message)
            ->setUpdatedAt(new \DateTimeImmutable());
        $this->entityManager->flush();

        $this->statusNotifier->notifyDecision($grant);

        return $grant;
    }

    /** Montant saisi en euros (« 1 200,50 ») converti en centimes ; -1 si invalide. */
    private static function toCents(mixed $value): int
    {
        if (is_int($value) || is_float($value)) {
            $value = (string) $value;
        }
        if (!is_string($value)) {
            return -1;
        }

        $value = str_replace([' ', ','], ['', '.'], trim($value));
        if (!preg_match('/^(\d{1,8})(?:\.(\d{1,2}))?$/', $value, $matches)) {
            return -1;
        }

        return ((int) $matches[1] * 100) + (int) str_pad($matches[2] ?? '0', 2, '0');
    }
}
