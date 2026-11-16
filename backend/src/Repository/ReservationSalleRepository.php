<?php

namespace App\Repository;

use App\Entity\Association;
use App\Entity\ReservationSalle;
use App\Entity\Salle;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ReservationSalle>
 */
class ReservationSalleRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ReservationSalle::class);
    }

    /**
     * @return list<ReservationSalle>
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

    /**
     * Retourne toutes les réservations actives (hors Refusée) qui chevauchent l'intervalle [start, end].
     *
     * @return list<ReservationSalle>
     */
    public function findOverlappingReservations(
        Salle $salle,
        \DateTimeImmutable $start,
        \DateTimeImmutable $end,
        ?int $excludeReservationId = null,
    ): array {
        $qb = $this->createQueryBuilder('r')
            ->andWhere('r.salle = :salle')
            ->andWhere('r.statut NOT IN (:inactive)')
            ->andWhere('r.dateDebut < :end')
            ->andWhere('r.dateFin > :start')
            ->setParameter('salle', $salle)
            ->setParameter('inactive', ['Refusée', 'Annulée', 'Clôturée'])
            ->setParameter('start', $start)
            ->setParameter('end', $end)
            ->orderBy('r.dateDebut', 'ASC');

        if ($excludeReservationId !== null) {
            $qb->andWhere('r.id != :excludeId')
                ->setParameter('excludeId', $excludeReservationId);
        }

        return $qb->getQuery()->getResult();
    }

    /**
     * Réservations déjà acceptées qui chevauchent un créneau. Pendant une campagne, plusieurs
     * associations peuvent demander le même créneau : seules les acceptations bloquent.
     *
     * @return list<ReservationSalle>
     */
    public function findAcceptedOverlaps(
        Salle $salle,
        \DateTimeImmutable $start,
        \DateTimeImmutable $end,
        ?int $excludeReservationId = null,
    ): array {
        $qb = $this->createQueryBuilder('r')
            ->andWhere('r.salle = :salle')
            ->andWhere('r.statut = :accepted')
            ->andWhere('r.dateDebut < :end')
            ->andWhere('r.dateFin > :start')
            ->setParameter('salle', $salle)
            ->setParameter('accepted', 'Validée')
            ->setParameter('start', $start)
            ->setParameter('end', $end)
            ->orderBy('r.dateDebut', 'ASC');

        if (null !== $excludeReservationId) {
            $qb->andWhere('r.id != :excludeId')->setParameter('excludeId', $excludeReservationId);
        }

        return $qb->getQuery()->getResult();
    }

    /**
     * Plages réservées ou verrouillées pour l'affichage calendrier sur un intervalle donné.
     *
     * @return list<ReservationSalle>
     */
    public function findActiveReservationsInInterval(
        Salle $salle,
        \DateTimeImmutable $start,
        \DateTimeImmutable $end,
    ): array {
        return $this->findOverlappingReservations($salle, $start, $end);
    }

    /**
     * Réservations ponctuelles (hors campagne), les plus proches d’abord.
     *
     * @return list<ReservationSalle>
     */
    public function findOneOffRequests(): array
    {
        return $this->createQueryBuilder('r')
            ->addSelect('salle', 'association')
            ->join('r.salle', 'salle')
            ->join('r.association', 'association')
            ->andWhere('r.campaign IS NULL')
            ->orderBy('r.dateDebut', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
