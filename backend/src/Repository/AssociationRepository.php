<?php

namespace App\Repository;

use App\Entity\Association;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Association>
 */
class AssociationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Association::class);
    }

    /**
     * @return list<Association>
     */
    public function findForAdministration(?string $status, int $page, int $itemsPerPage, ?string $search = null): array
    {
        $queryBuilder = $this->createQueryBuilder('association')
            ->leftJoin('association.users', 'user')
            ->addSelect('user')
            ->orderBy('association.createdAt', 'DESC')
            ->addOrderBy('association.id', 'DESC')
            ->setFirstResult(($page - 1) * $itemsPerPage)
            ->setMaxResults($itemsPerPage);

        if ($status !== null) {
            $queryBuilder
                ->andWhere('association.statut = :status')
                ->setParameter('status', $status);
        }

        if ($search !== null && $search !== '') {
            $queryBuilder
                ->andWhere('LOWER(association.nom) LIKE :search OR LOWER(user.email) LIKE :search OR LOWER(user.nom) LIKE :search')
                ->setParameter('search', '%' . mb_strtolower($search) . '%');
        }

        return $queryBuilder->getQuery()->getResult();
    }

    public function countForAdministration(?string $status, ?string $search = null): int
    {
        $queryBuilder = $this->createQueryBuilder('association')
            ->select('COUNT(DISTINCT association.id)');

        if ($status !== null) {
            $queryBuilder
                ->andWhere('association.statut = :status')
                ->setParameter('status', $status);
        }

        if ($search !== null && $search !== '') {
            $queryBuilder
                ->leftJoin('association.users', 'user')
                ->andWhere('LOWER(association.nom) LIKE :search OR LOWER(user.email) LIKE :search OR LOWER(user.nom) LIKE :search')
                ->setParameter('search', '%' . mb_strtolower($search) . '%');
        }

        return (int) $queryBuilder->getQuery()->getSingleScalarResult();
    }

    /**
     * @return array{pending: int, validated: int, refused: int, total: int}
     */
    public function getCountsForAdministration(): array
    {
        $qb = $this->createQueryBuilder('association')
            ->select("
                SUM(CASE WHEN association.statut = 'PENDING_VALIDATION' THEN 1 ELSE 0 END) AS pending,
                SUM(CASE WHEN association.statut = 'VALIDATED' THEN 1 ELSE 0 END) AS validated,
                SUM(CASE WHEN association.statut = 'REFUSED' THEN 1 ELSE 0 END) AS refused,
                COUNT(association.id) AS total
            ");

        $result = $qb->getQuery()->getSingleResult();

        return [
            'pending' => (int) ($result['pending'] ?? 0),
            'validated' => (int) ($result['validated'] ?? 0),
            'refused' => (int) ($result['refused'] ?? 0),
            'total' => (int) ($result['total'] ?? 0),
        ];
    }
}
