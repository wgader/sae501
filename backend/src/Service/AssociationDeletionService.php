<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Association;
use App\Entity\CampaignWishSubmission;
use App\Entity\DemandeStatusHistory;
use App\Entity\DemandeSubvention;
use App\Entity\DocumentJustificatif;
use App\Entity\ExternalEvent;
use App\Entity\ExternalEventFile;
use App\Entity\ReservationMateriel;
use App\Entity\ReservationSalle;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;

/**
 * Supprime une association et tout ce qui lui appartient : comptes, demandes de subvention,
 * réservations de salle et de matériel, vœux de campagne, évènements, pièces et photo.
 *
 * Les lignes sont supprimées dans une seule transaction, des enfants vers le parent, pour
 * qu’aucune clé étrangère ne bloque l’opération. Les fichiers ne sont effacés qu’une fois la
 * transaction validée : en cas d’échec, la base et le disque restent cohérents.
 */
final class AssociationDeletionService
{
    private const PHOTO_FOLDER = 'associations';

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly PrivateDocumentStorage $documentStorage,
        private readonly SecureEventFileStorage $eventFileStorage,
        private readonly ImageStorage $imageStorage,
        private readonly LoggerInterface $logger,
    ) {
    }

    public function delete(Association $association): void
    {
        $associationId = (int) $association->getId();
        $logo = $association->getLogoUrl();

        /** @var list<string> $documentPaths */
        $documentPaths = [];
        /** @var list<string> $eventFilePaths */
        $eventFilePaths = [];

        $this->entityManager->wrapInTransaction(function (EntityManagerInterface $em) use ($associationId, &$documentPaths, &$eventFilePaths): void {
            $documentPaths = $this->column($em, 'SELECT d.fichierUrl FROM '.DocumentJustificatif::class.' d WHERE d.association = :id', $associationId);
            $eventIds = $this->column($em, 'SELECT e.id FROM '.ExternalEvent::class.' e WHERE e.asso_id = :id', $associationId);

            if ([] !== $eventIds) {
                $eventFilePaths = $em->createQuery('SELECT f.file_path FROM '.ExternalEventFile::class.' f WHERE f.event_id IN (:ids)')
                    ->setParameter('ids', $eventIds)
                    ->getSingleColumnResult();
                $em->createQuery('DELETE FROM '.ExternalEventFile::class.' f WHERE f.event_id IN (:ids)')->setParameter('ids', $eventIds)->execute();
                $em->createQuery('DELETE FROM '.ExternalEvent::class.' e WHERE e.id IN (:ids)')->setParameter('ids', $eventIds)->execute();
            }

            // L’historique des statuts n’a pas de clé étrangère : on le nettoie par type et identifiant.
            $requests = [
                'subvention' => DemandeSubvention::class,
                'materiel' => ReservationMateriel::class,
                'salle' => ReservationSalle::class,
            ];
            foreach ($requests as $type => $entity) {
                $ids = $this->column($em, 'SELECT r.id FROM '.$entity.' r WHERE r.association = :id', $associationId);
                if ([] !== $ids) {
                    $em->createQuery('DELETE FROM '.DemandeStatusHistory::class.' h WHERE h.demandeType = :type AND h.demandeId IN (:ids)')
                        ->setParameter('type', $type)
                        ->setParameter('ids', $ids)
                        ->execute();
                }
                // Lignes budgétaires et lignes de matériel partent avec leur demande (ON DELETE CASCADE).
                $this->deleteWhereAssociation($em, $entity, $associationId);
            }

            $this->deleteWhereAssociation($em, CampaignWishSubmission::class, $associationId);
            $this->deleteWhereAssociation($em, DocumentJustificatif::class, $associationId);
            // Les notifications des comptes partent avec eux (ON DELETE CASCADE).
            $this->deleteWhereAssociation($em, User::class, $associationId);
            $em->createQuery('DELETE FROM '.Association::class.' a WHERE a.id = :id')->setParameter('id', $associationId)->execute();
        });

        // Les entités chargées avant la suppression ne doivent plus être gérées par Doctrine.
        $this->entityManager->clear();

        $this->removeFiles($documentPaths, fn (string $path) => $this->documentStorage->delete($path));
        $this->removeFiles($eventFilePaths, fn (string $path) => $this->eventFileStorage->delete($path));
        if (null !== $logo) {
            $this->removeFiles([$logo], fn (string $path) => $this->imageStorage->delete($path, self::PHOTO_FOLDER));
        }
    }

    /**
     * @return list<int|string>
     */
    private function column(EntityManagerInterface $em, string $dql, int $associationId): array
    {
        /** @var list<int|string> */
        return array_values(array_filter(
            $em->createQuery($dql)->setParameter('id', $associationId)->getSingleColumnResult(),
            static fn (mixed $value): bool => null !== $value && '' !== $value,
        ));
    }

    /**
     * @param class-string $entity
     */
    private function deleteWhereAssociation(EntityManagerInterface $em, string $entity, int $associationId): void
    {
        $em->createQuery('DELETE FROM '.$entity.' x WHERE x.association = :id')->setParameter('id', $associationId)->execute();
    }

    /**
     * Un fichier qui ne peut pas être effacé ne fait pas échouer la suppression déjà validée :
     * il est seulement signalé dans les logs.
     *
     * @param list<int|string> $paths
     * @param callable(string): void $remove
     */
    private function removeFiles(array $paths, callable $remove): void
    {
        foreach ($paths as $path) {
            try {
                $remove((string) $path);
            } catch (\Throwable $exception) {
                $this->logger->warning('Fichier d’une association supprimée resté sur le disque', [
                    'path' => $path,
                    'exception' => $exception,
                ]);
            }
        }
    }
}
