<?php

namespace App\Repository;

use App\Entity\DemandeStatusHistory;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<DemandeStatusHistory>
 */
class DemandeStatusHistoryRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, DemandeStatusHistory::class);
    }

    /**
     * @return list<DemandeStatusHistory>
     */
    public function findTimeline(string $demandeType, int $demandeId): array
    {
        return $this->createQueryBuilder('h')
            ->andWhere('h.demandeType = :type')
            ->andWhere('h.demandeId = :id')
            ->setParameter('type', $demandeType)
            ->setParameter('id', $demandeId)
            ->orderBy('h.createdAt', 'ASC')
            ->getQuery()
            ->getResult();
    }
}

