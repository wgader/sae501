<?php

namespace App\Repository;

use App\Entity\ReservationMateriel;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ReservationMateriel>
 */
class ReservationMaterielRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ReservationMateriel::class);
    }

    /**
     * Retourne les réservations futures validées associées à un matériel donné.
     *
     * @return list<ReservationMateriel>
     */
    public function findFutureValidatedForMateriel(int $materielId, ?\DateTimeImmutable $from = null): array
    {
        $now = $from ?? new \DateTimeImmutable();

        return $this->createQueryBuilder('r')
            ->innerJoin('r.lignes', 'l')
            ->addSelect('l')
            ->where('l.materiel = :materielId')
            ->andWhere('r.statut = :statut')
            ->andWhere('r.dateRestitution >= :now')
            ->setParameter('materielId', $materielId)
            ->setParameter('statut', 'Validée')
            ->setParameter('now', $now)
            ->orderBy('r.dateRetrait', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Retourne les quantités engagées sur une période pour chaque équipement.
     *
     * Les demandes en attente sont comptabilisées afin de pré-réserver le stock.
     *
     * @return list<array{id: int, engagedStock: int|string}>
     */
    public function getEngagedStockByEquipment(
        \DateTimeImmutable $start,
        \DateTimeImmutable $end,
    ): array {
        return $this->createQueryBuilder('r')
            ->select('IDENTITY(l.materiel) AS id')
            ->addSelect('COALESCE(SUM(l.quantite), 0) AS engagedStock')
            ->innerJoin('r.lignes', 'l')
            ->where('r.statut IN (:statuts)')
            ->andWhere('r.dateRetrait < :end')
            ->andWhere('r.dateRestitution > :start')
            ->setParameter('statuts', ['En attente', 'Validée'])
            ->setParameter('start', $start)
            ->setParameter('end', $end)
            ->groupBy('l.materiel')
            ->getQuery()
            ->getArrayResult();
    }

    /**
     * @return list<ReservationMateriel>
     */
    public function findForAdministration(
        ?string $status,
        int $page,
        int $itemsPerPage,
        ?string $search = null,
    ): array {
        $queryBuilder = $this->createQueryBuilder('reservation')
            ->leftJoin('reservation.association', 'association')
            ->leftJoin('association.users', 'user')
            ->addSelect('association', 'user')
            ->orderBy('reservation.createdAt', 'DESC')
            ->addOrderBy('reservation.id', 'DESC')
            ->setFirstResult(($page - 1) * $itemsPerPage)
            ->setMaxResults($itemsPerPage);

        if ($status !== null) {
            $queryBuilder
                ->andWhere('reservation.statut = :status')
                ->setParameter('status', $status);
        }

        if ($search !== null && trim($search) !== '') {
            $queryBuilder
                ->andWhere('LOWER(association.nom) LIKE :search OR LOWER(user.email) LIKE :search')
                ->setParameter('search', '%' . strtolower(trim($search)) . '%');
        }

        return $queryBuilder->getQuery()->getResult();
    }

    public function countForAdministration(?string $status, ?string $search = null): int
    {
        $queryBuilder = $this->createQueryBuilder('reservation')
            ->select('COUNT(DISTINCT reservation.id)')
            ->leftJoin('reservation.association', 'association')
            ->leftJoin('association.users', 'user');

        if ($status !== null) {
            $queryBuilder
                ->andWhere('reservation.statut = :status')
                ->setParameter('status', $status);
        }

        if ($search !== null && trim($search) !== '') {
            $queryBuilder
                ->andWhere('LOWER(association.nom) LIKE :search OR LOWER(user.email) LIKE :search')
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
            'pending' => $this->countForAdministration('En attente'),
            'validated' => $this->countForAdministration('Validée'),
            'refused' => $this->countForAdministration('Refusée'),
            'total' => $this->countForAdministration(null),
        ];
    }
}
