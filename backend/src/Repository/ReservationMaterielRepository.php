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
