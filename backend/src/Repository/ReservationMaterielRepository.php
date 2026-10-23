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
}

