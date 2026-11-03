<?php

namespace App\Repository;

use App\Entity\DocumentJustificatif;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<DocumentJustificatif>
 */
class DocumentJustificatifRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, DocumentJustificatif::class);
    }

    /**
     * @return list<DocumentJustificatif>
     */
    public function findByLinkedEntity(string $type, int $id): array
    {
        return $this->createQueryBuilder('d')
            ->andWhere('d.lieAType = :type')
            ->andWhere('d.lieAId = :id')
            ->andWhere('d.deletedAt IS NULL')
            ->setParameter('type', $type)
            ->setParameter('id', $id)
            ->orderBy('d.createdAt', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
