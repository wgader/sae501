<?php

namespace App\Repository;

use App\Entity\StockAdjustment;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<StockAdjustment>
 */
class StockAdjustmentRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, StockAdjustment::class);
    }

    /**
     * @return list<StockAdjustment>
     */
    public function findForEquipment(int $equipmentId): array
    {
        return $this->createQueryBuilder('adjustment')
            ->andWhere('IDENTITY(adjustment.materiel) = :equipmentId')
            ->setParameter('equipmentId', $equipmentId)
            ->orderBy('adjustment.createdAt', 'DESC')
            ->addOrderBy('adjustment.id', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
