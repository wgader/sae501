<?php

declare(strict_types=1);

namespace App\Controller;

use App\Repository\CampaignRepository;
use App\Service\CampaignService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/campaigns')]
#[IsGranted('ROLE_USER')]
final class CurrentCampaignController extends AbstractController
{
    public function __construct(
        private readonly CampaignRepository $repository,
        private readonly CampaignService $campaignService,
    ) {
    }

    #[Route('/current', name: 'campaign_current', methods: ['GET'])]
    public function current(): JsonResponse
    {
        $this->campaignService->synchronize(new \DateTimeImmutable());
        $campaign = $this->repository->findCurrentState(new \DateTimeImmutable());

        return $this->json([
            'active' => \App\Entity\Campaign::STATUS_ACTIVE === $campaign?->getStatus(),
            'campaign' => null === $campaign ? null : CampaignController::serializeCampaign($campaign),
        ]);
    }
}
