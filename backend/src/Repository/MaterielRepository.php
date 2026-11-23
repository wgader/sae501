<?php

namespace App\Repository;

use App\Entity\Materiel;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\DBAL\LockMode;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Materiel>
 */
class MaterielRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Materiel::class);
    }

    /**
     * @return list<Materiel>
     */
    public function findAvailableForCatalog(): array
    {
        return $this->createQueryBuilder('m')
            ->where('m.isArchived = :isArchived')
            ->setParameter('isArchived', false)
            ->orderBy('m.designation', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * @return list<Materiel>
     */
    public function findForAdministration(?string $category = null, ?bool $isArchived = null): array
    {
        $qb = $this->createQueryBuilder('m');

        if ($category !== null && $category !== '') {
            $qb->andWhere('m.categorie = :category')
                ->setParameter('category', $category);
        }

        if ($isArchived !== null) {
            $qb->andWhere('m.isArchived = :isArchived')
                ->setParameter('isArchived', $isArchived);
        }

        return $qb->orderBy('m.id', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * @param list<int> $ids
     * @return list<Materiel>
     */
    public function findForReservationUpdate(array $ids): array
    {
        return $this->createQueryBuilder('m')
            ->where('m.id IN (:ids)')
            ->setParameter('ids', $ids)
            ->orderBy('m.id', 'ASC')
            ->getQuery()
            ->setLockMode(LockMode::PESSIMISTIC_WRITE)
            ->getResult();
    }

    public function countByCategory(string $code): int
    {
        return (int) $this->createQueryBuilder('m')
            ->select('COUNT(m.id)')
            ->andWhere('m.categorie = :code')
            ->setParameter('code', $code)
            ->getQuery()
            ->getSingleScalarResult();
    }

    /**
     * @return list<string>
     */
    public function findDistinctCategories(): array
    {
        /** @var list<array{categorie: string}> $rows */
        $rows = $this->createQueryBuilder('m')
            ->select('DISTINCT m.categorie')
            ->getQuery()
            ->getArrayResult();

        return array_map(static fn (array $row): string => $row['categorie'], $rows);
    }
}
