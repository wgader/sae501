<?php

namespace App\Repository;

use App\Entity\Association;
use App\Entity\DemandeSubvention;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<DemandeSubvention>
 */
class DemandeSubventionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, DemandeSubvention::class);
    }

    /**
     * @return list<DemandeSubvention>
     */
    public function findByAssociation(Association $association): array
    {
        return $this->createQueryBuilder('d')
            ->andWhere('d.association = :association')
            ->setParameter('association', $association)
            ->orderBy('d.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }
}

