<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Campaign;
use App\Repository\CampaignRepository;
use Doctrine\ORM\EntityManagerInterface;

final class CampaignService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly CampaignRepository $repository,
    ) {
    }

    public function open(Campaign $campaign): Campaign
    {
        if (Campaign::STATUS_PROGRAMMED !== $campaign->getStatus()) {
            throw new \DomainException('Seule une campagne programmée peut être ouverte.');
        }

        $campaign->setStatus(Campaign::STATUS_ACTIVE)->touch();
        $this->entityManager->flush();

        return $campaign;
    }

    public function close(Campaign $campaign): Campaign
    {
        if (Campaign::STATUS_ACTIVE !== $campaign->getStatus()) {
            throw new \DomainException('Seule une campagne active peut être clôturée.');
        }

        $campaign->setStatus(Campaign::STATUS_CLOSED)->touch();
        $this->entityManager->flush();

        return $campaign;
    }

    /**
     * @return list<Campaign>
     */
    public function synchronize(\DateTimeImmutable $now): array
    {
        $updated = [];
        foreach ($this->repository->findSynchronizable($now) as $campaign) {
            if (Campaign::STATUS_PROGRAMMED === $campaign->getStatus()) {
                $campaign->setStatus(Campaign::STATUS_ACTIVE)->touch();
            } elseif (Campaign::STATUS_ACTIVE === $campaign->getStatus()) {
                $campaign->setStatus(Campaign::STATUS_CLOSED)->touch();
            }
            $updated[] = $campaign;
        }

        if ([] !== $updated) {
            $this->entityManager->flush();
        }

        return $updated;
    }
}
