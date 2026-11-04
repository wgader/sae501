<?php

namespace App\Repository;

use App\Entity\Association;
use App\Entity\ReservationMateriel;
use Doctrine\ORM\QueryBuilder;
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
     * @return list<ReservationMateriel>
     */
    public function findByAssociation(Association $association): array
    {
        return $this->createQueryBuilder('r')
            ->andWhere('r.association = :association')
            ->setParameter('association', $association)
            ->orderBy('r.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function countForAdministration(?string $status = null, ?string $search = null): int
    {
        $queryBuilder = $this->createQueryBuilder('r')
            ->select('COUNT(DISTINCT r.id)')
            ->leftJoin('r.association', 'association')
            ->leftJoin('association.users', 'user');

        $this->applyAdministrationFilters($queryBuilder, $status, $search);

        return (int) $queryBuilder->getQuery()->getSingleScalarResult();
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
        $queryBuilder = $this->createQueryBuilder('r')
            ->leftJoin('r.association', 'association')
            ->leftJoin('association.users', 'user')
            ->addSelect('association', 'user')
            ->orderBy('r.createdAt', 'DESC')
            ->setFirstResult(($page - 1) * $itemsPerPage)
            ->setMaxResults($itemsPerPage);

        $this->applyAdministrationFilters($queryBuilder, $status, $search);

        return $queryBuilder->getQuery()->getResult();
    }

    /**
     * @return array{pending: int, validated: int, refused: int, total: int}
     */
    public function getCountsForAdministration(): array
    {
        $result = $this->createQueryBuilder('r')
            ->select("SUM(CASE WHEN r.statut IN ('En attente', 'En cours de traitement', 'Complément requis') THEN 1 ELSE 0 END) AS pending")
            ->addSelect("SUM(CASE WHEN r.statut = 'Validée' THEN 1 ELSE 0 END) AS validated")
            ->addSelect("SUM(CASE WHEN r.statut = 'Refusée' THEN 1 ELSE 0 END) AS refused")
            ->addSelect('COUNT(r.id) AS total')
            ->getQuery()
            ->getSingleResult();

        return [
            'pending' => (int) ($result['pending'] ?? 0),
            'validated' => (int) ($result['validated'] ?? 0),
            'refused' => (int) ($result['refused'] ?? 0),
            'total' => (int) ($result['total'] ?? 0),
        ];
    }

    private function applyAdministrationFilters(
        QueryBuilder $queryBuilder,
        ?string $status,
        ?string $search,
    ): void {
        if ($status !== null) {
            $queryBuilder
                ->andWhere('r.statut = :status')
                ->setParameter('status', $status);
        }

        if ($search !== null && trim($search) !== '') {
            $queryBuilder
                ->andWhere('LOWER(r.motifEvenement) LIKE :search OR LOWER(association.nom) LIKE :search OR LOWER(user.email) LIKE :search OR LOWER(user.nom) LIKE :search OR LOWER(user.prenom) LIKE :search')
                ->setParameter('search', '%' . strtolower(trim($search)) . '%');
        }
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
     * @return list<array{id: int, engagedStock: int}>
     */
    public function getEngagedStockByEquipment(
        \DateTimeImmutable $start,
        \DateTimeImmutable $end,
    ): array {
        return $this->createQueryBuilder('r')
            ->select('IDENTITY(l.materiel) AS id, SUM(l.quantite) AS engagedStock')
            ->innerJoin('r.lignes', 'l')
            ->andWhere('r.statut IN (:statuses)')
            ->andWhere('r.dateRetrait < :end')
            ->andWhere('r.dateRestitution > :start')
            ->setParameter('statuses', ['En attente', 'En cours de traitement', 'Validée'])
            ->setParameter('start', $start)
            ->setParameter('end', $end)
            ->groupBy('l.materiel')
            ->getQuery()
            ->getArrayResult();
    }
}
