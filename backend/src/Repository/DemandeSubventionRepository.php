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

    /**
     * @return list<DemandeSubvention>
     */
    public function findDraftsByAssociation(Association $association): array
    {
        return $this->createQueryBuilder('d')
            ->andWhere('d.association = :association')
            ->andWhere('d.statut = :status')
            ->setParameter('association', $association)
            ->setParameter('status', 'Brouillon')
            ->orderBy('d.updatedAt', 'DESC')
            ->addOrderBy('d.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Dossiers transmis à la mairie (tous sauf les brouillons).
     *
     * @return list<DemandeSubvention>
     */
    public function findSubmittedByAssociation(Association $association): array
    {
        return $this->createQueryBuilder('d')
            ->andWhere('d.association = :association')
            ->andWhere('d.statut <> :draft')
            ->setParameter('association', $association)
            ->setParameter('draft', 'Brouillon')
            ->orderBy('d.updatedAt', 'DESC')
            ->addOrderBy('d.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * @param list<string>|null $statuses null pour tous les dossiers transmis
     *
     * @return list<DemandeSubvention>
     */
    public function findForAdministration(?array $statuses, int $limit = 200): array
    {
        $qb = $this->createQueryBuilder('d')
            ->addSelect('a')
            ->leftJoin('d.association', 'a')
            ->andWhere('d.statut <> :draft')
            ->setParameter('draft', 'Brouillon')
            ->orderBy('d.updatedAt', 'DESC')
            ->addOrderBy('d.createdAt', 'DESC')
            ->setMaxResults($limit);

        if (null !== $statuses) {
            $qb->andWhere('d.statut IN (:statuses)')->setParameter('statuses', $statuses);
        }

        return $qb->getQuery()->getResult();
    }

    /**
     * @return array<string, int> nombre de dossiers transmis par statut
     */
    public function countByStatusForAdministration(): array
    {
        /** @var list<array{statut: string, total: int|string}> $rows */
        $rows = $this->createQueryBuilder('d')
            ->select('d.statut AS statut', 'COUNT(d.id) AS total')
            ->andWhere('d.statut <> :draft')
            ->setParameter('draft', 'Brouillon')
            ->groupBy('d.statut')
            ->getQuery()
            ->getArrayResult();

        $counts = [];
        foreach ($rows as $row) {
            $counts[$row['statut']] = (int) $row['total'];
        }

        return $counts;
    }
}
