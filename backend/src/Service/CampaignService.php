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

        $this->assertNoOtherActiveCampaign($campaign);
        $now = new \DateTimeImmutable();
        // Ouverture anticipée : la date affichée correspond à l’ouverture réelle.
        if ($campaign->getOpeningAt() > $now) {
            $campaign->setOpeningAt($now);
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

        $now = new \DateTimeImmutable();
        // Clôture anticipée : la date de fin affichée correspond à la clôture réelle.
        if ($campaign->getClosingAt() > $now) {
            $campaign->setClosingAt($now);
        }
        $campaign->setStatus(Campaign::STATUS_CLOSED)->touch();
        $this->entityManager->flush();

        return $campaign;
    }

    /**
     * Avance ou repousse l’ouverture et la clôture ; le statut suit les nouvelles dates (une
     * campagne clôturée dont la fin est repoussée rouvre, une ouverture repoussée la reprogramme).
     */
    public function reschedule(Campaign $campaign, \DateTimeImmutable $openingAt, \DateTimeImmutable $closingAt): Campaign
    {
        if ($closingAt <= $openingAt) {
            throw new \InvalidArgumentException('La clôture doit être postérieure à l’ouverture.');
        }

        $now = new \DateTimeImmutable();
        $status = match (true) {
            $now < $openingAt => Campaign::STATUS_PROGRAMMED,
            $now < $closingAt => Campaign::STATUS_ACTIVE,
            default => Campaign::STATUS_CLOSED,
        };
        if (Campaign::STATUS_ACTIVE === $status) {
            $this->assertNoOtherActiveCampaign($campaign);
        }

        $campaign->setOpeningAt($openingAt)->setClosingAt($closingAt)->setStatus($status)->touch();
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

    private function assertNoOtherActiveCampaign(Campaign $campaign): void
    {
        foreach ($this->repository->findBy(['status' => Campaign::STATUS_ACTIVE]) as $active) {
            if ($active->getId() !== $campaign->getId()) {
                throw new \DomainException(\sprintf('La campagne « %s » est déjà ouverte : clôturez-la d’abord.', $active->getSeasonLabel()));
            }
        }
    }
}
