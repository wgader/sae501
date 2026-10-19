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
    public function findForAdministration(?string $status, int $page, int $itemsPerPage): array
    {
        $queryBuilder = $this->createQueryBuilder('association')
            ->orderBy('association.createdAt', 'DESC')
            ->addOrderBy('association.id', 'DESC')
            ->setFirstResult(($page - 1) * $itemsPerPage)
            ->setMaxResults($itemsPerPage);

        if ($status !== null) {
            $queryBuilder
                ->andWhere('association.statut = :status')
                ->setParameter('status', $status);
        }

        return $queryBuilder->getQuery()->getResult();
    }

    public function countForAdministration(?string $status): int
    {
        $queryBuilder = $this->createQueryBuilder('association')
            ->select('COUNT(association.id)');

        if ($status !== null) {
            $queryBuilder
                ->andWhere('association.statut = :status')
                ->setParameter('status', $status);
        }

        return (int) $queryBuilder->getQuery()->getSingleScalarResult();
    }

    /**
     * @return array{pending: int, validated: int, refused: int, total: int}
     */
    public function getCountsForAdministration(): array
    {
        return [
            'pending' => $this->countForAdministration('PENDING_VALIDATION'),
            'validated' => $this->countForAdministration('VALIDATED'),
            'refused' => $this->countForAdministration('REFUSED'),
            'total' => $this->countForAdministration(null),
        ];
    }
}
