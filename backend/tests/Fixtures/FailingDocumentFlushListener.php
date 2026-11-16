<?php

declare(strict_types=1);

namespace App\Tests\Fixtures;

use App\Entity\DocumentJustificatif;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Event\OnFlushEventArgs;
use Doctrine\ORM\Events;

/**
 * Simule une panne de la base au moment d’enregistrer un justificatif, après que le
 * fichier a déjà été écrit sur le disque.
 */
final class FailingDocumentFlushListener
{
    public static function attachTo(EntityManagerInterface $entityManager): void
    {
        $entityManager->getEventManager()->addEventListener(Events::onFlush, new self());
    }

    public function onFlush(OnFlushEventArgs $event): void
    {
        foreach ($event->getObjectManager()->getUnitOfWork()->getScheduledEntityInsertions() as $entity) {
            if ($entity instanceof DocumentJustificatif) {
                throw new \RuntimeException('Panne simulée de la base de données.');
            }
        }
    }
}
