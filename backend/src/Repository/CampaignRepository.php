<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Campaign;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Campaign>
 */
final class CampaignRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Campaign::class);
    }

    /**
     * @return list<Campaign>
     */
    public function findAllOrdered(): array
    {
        return $this->createQueryBuilder('campaign')
            ->orderBy('campaign.openingAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findCurrent(\DateTimeImmutable $now, ?string $resourceType = null): ?Campaign
    {
        $campaigns = $this->createQueryBuilder('campaign')
            ->andWhere('campaign.status = :status')
            ->setParameter('status', Campaign::STATUS_ACTIVE)
            ->orderBy('campaign.openingAt', 'DESC')
            ->getQuery()
            ->getResult();

        foreach ($campaigns as $campaign) {
            if (null === $resourceType || in_array($resourceType, $campaign->getResourceTypes(), true)) {
                return $campaign;
            }
        }

        return null;
    }

    public function findCurrentState(\DateTimeImmutable $now): ?Campaign
    {
        $active = $this->findCurrent($now);
        if (null !== $active) {
            return $active;
        }

        $programmed = $this->createQueryBuilder('campaign')
            ->andWhere('campaign.status = :status')
            ->andWhere('campaign.openingAt > :now')
            ->setParameter('status', Campaign::STATUS_PROGRAMMED)
            ->setParameter('now', $now)
            ->orderBy('campaign.openingAt', 'ASC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
        if (null !== $programmed) {
            return $programmed;
        }

        return $this->createQueryBuilder('campaign')
            ->andWhere('campaign.status = :status')
            ->setParameter('status', Campaign::STATUS_CLOSED)
            ->orderBy('campaign.closingAt', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * @return list<Campaign>
     */
    public function findSynchronizable(\DateTimeImmutable $now): array
    {
        return $this->createQueryBuilder('campaign')
            ->andWhere('(campaign.status = :programmed AND campaign.openingAt <= :now)')
            ->orWhere('(campaign.status = :active AND campaign.closingAt <= :now)')
            ->setParameter('programmed', Campaign::STATUS_PROGRAMMED)
            ->setParameter('active', Campaign::STATUS_ACTIVE)
            ->setParameter('now', $now)
            ->getQuery()
            ->getResult();
    }
}
