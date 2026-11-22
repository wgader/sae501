<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Campaign;
use App\Entity\CampaignWish;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<CampaignWish>
 */
class CampaignWishRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CampaignWish::class);
    }

    /**
     * Vœux d'une campagne, triés par salle, jour puis heure : l'ordre de lecture de l'arbitrage.
     *
     * @return list<CampaignWish>
     */
    public function findForCampaign(Campaign $campaign): array
    {
        return $this->createQueryBuilder('wish')
            ->addSelect('submission', 'association', 'salle')
            ->join('wish.submission', 'submission')
            ->join('submission.association', 'association')
            ->join('wish.salle', 'salle')
            ->andWhere('submission.campaign = :campaign')
            ->setParameter('campaign', $campaign)
            ->orderBy('salle.nom', 'ASC')
            ->addOrderBy('wish.dayOfWeek', 'ASC')
            ->addOrderBy('wish.startTime', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Vœux de la même campagne qui se chevauchent avec celui-ci (même salle, même jour).
     *
     * @return list<CampaignWish>
     */
    public function findOverlapping(CampaignWish $wish): array
    {
        $candidates = $this->createQueryBuilder('wish')
            ->join('wish.submission', 'submission')
            ->andWhere('submission.campaign = :campaign')
            ->andWhere('wish.salle = :salle')
            ->andWhere('wish.dayOfWeek = :day')
            ->andWhere('wish.id != :id')
            ->setParameter('campaign', $wish->getSubmission()?->getCampaign())
            ->setParameter('salle', $wish->getSalle())
            ->setParameter('day', $wish->getDayOfWeek())
            ->setParameter('id', $wish->getId())
            ->getQuery()
            ->getResult();

        return array_values(array_filter($candidates, static fn (CampaignWish $other): bool => $wish->overlaps($other)));
    }
}
