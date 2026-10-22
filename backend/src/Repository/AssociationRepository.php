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
            ->orderBy('association.createdAt', 'DESC')
            ->addOrderBy('association.id', 'DESC')
            ->setFirstResult(($page - 1) * $itemsPerPage)
            ->setMaxResults($itemsPerPage);

        if ($status !== null) {
            $queryBuilder
                ->andWhere('association.statut = :status')
                ->setParameter('status', $status);
        }

        if ($search !== null && trim($search) !== '') {
            $queryBuilder
                ->leftJoin('association.users', 'user')
                ->andWhere('LOWER(association.nom) LIKE :search OR LOWER(user.email) LIKE :search OR LOWER(user.nom) LIKE :search OR LOWER(user.prenom) LIKE :search')
                ->setParameter('search', '%' . strtolower(trim($search)) . '%');
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

        if ($search !== null && trim($search) !== '') {
            $queryBuilder
                ->leftJoin('association.users', 'user')
                ->andWhere('LOWER(association.nom) LIKE :search OR LOWER(user.email) LIKE :search OR LOWER(user.nom) LIKE :search OR LOWER(user.prenom) LIKE :search')
                ->setParameter('search', '%' . strtolower(trim($search)) . '%');
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
