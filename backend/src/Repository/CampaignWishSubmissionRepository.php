<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Association;
use App\Entity\Campaign;
use App\Entity\CampaignWishSubmission;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<CampaignWishSubmission>
 */
class CampaignWishSubmissionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CampaignWishSubmission::class);
    }

    /**
     * @return list<CampaignWishSubmission>
     */
    public function findForAssociation(Campaign $campaign, Association $association): array
    {
        return $this->findBy(['campaign' => $campaign, 'association' => $association], ['submittedAt' => 'DESC']);
    }
}
