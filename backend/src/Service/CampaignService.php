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
        // Ouverture anticipée : les dates saisies restent celles prévues, seul le statut change.
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
     * Rouvre une campagne clôturée par erreur : ses demandes restent rattachées et réapparaissent
     * telles quelles. Une nouvelle date de clôture est exigée si la précédente est passée.
     */
    public function reopen(Campaign $campaign, ?\DateTimeImmutable $closingAt): Campaign
    {
        if (Campaign::STATUS_CLOSED !== $campaign->getStatus()) {
            throw new \DomainException('Seule une campagne clôturée peut être rouverte.');
        }

        $closingAt ??= $campaign->getClosingAt();
        if (null === $closingAt || $closingAt <= new \DateTimeImmutable()) {
            throw new \InvalidArgumentException('Indiquez une nouvelle date de clôture, postérieure à maintenant.');
        }

        $this->assertNoOtherActiveCampaign($campaign);
        $campaign->setClosingAt($closingAt)->setStatus(Campaign::STATUS_ACTIVE)->touch();
        $this->entityManager->flush();

        return $campaign;
    }

    /**
     * Modifie les dates de dépôt et la période réservable. Le statut suit les nouvelles dates : une
     * campagne clôturée dont la fin est repoussée rouvre, une ouverture repoussée la reprogramme.
     */
    public function reschedule(
        Campaign $campaign,
        \DateTimeImmutable $openingAt,
        \DateTimeImmutable $closingAt,
        ?\DateTimeImmutable $periodStart = null,
        ?\DateTimeImmutable $periodEnd = null,
    ): Campaign {
        if ($closingAt <= $openingAt) {
            throw new \InvalidArgumentException('La clôture doit être postérieure à l’ouverture.');
        }
        if (null !== $periodStart && null !== $periodEnd && $periodEnd < $periodStart) {
            throw new \InvalidArgumentException('La fin de la période réservable doit suivre son début.');
        }

        $now = new \DateTimeImmutable();
        $status = match (true) {
            $now >= $closingAt => Campaign::STATUS_CLOSED,
            $now >= $openingAt => Campaign::STATUS_ACTIVE,
            default => Campaign::STATUS_PROGRAMMED,
        };
        if (Campaign::STATUS_ACTIVE === $status) {
            $this->assertNoOtherActiveCampaign($campaign);
        }

        $campaign
            ->setOpeningAt($openingAt)
            ->setClosingAt($closingAt)
            ->setPeriodStart($periodStart)
            ->setPeriodEnd($periodEnd)
            ->setStatus($status)
            ->touch();
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
