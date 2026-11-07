<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\Campaign;
use App\Service\CampaignService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\ExpressionLanguage\Expression;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted(new Expression("is_granted('ROLE_ADMIN') or is_granted('ROLE_GESTION_SALLE')"))]
final class CampaignController extends AbstractController
{
    public function __construct(
        private readonly CampaignService $campaignService,
    ) {
    }

    #[Route('/api/admin/campaigns/{id}/open', name: 'admin_campaign_open', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function open(Campaign $campaign): JsonResponse
    {
        try {
            return $this->json(self::serializeCampaign($this->campaignService->open($campaign)));
        } catch (\DomainException $exception) {
            return $this->json(['message' => $exception->getMessage()], Response::HTTP_CONFLICT);
        }
    }

    #[Route('/api/admin/campaigns/{id}/close', name: 'admin_campaign_close', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function close(Campaign $campaign): JsonResponse
    {
        try {
            return $this->json(self::serializeCampaign($this->campaignService->close($campaign)));
        } catch (\DomainException $exception) {
            return $this->json(['message' => $exception->getMessage()], Response::HTTP_CONFLICT);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public static function serializeCampaign(Campaign $campaign): array
    {
        return [
            'id' => $campaign->getId(),
            'seasonLabel' => $campaign->getSeasonLabel(),
            'openingAt' => $campaign->getOpeningAt()?->format(\DateTimeInterface::ATOM),
            'closingAt' => $campaign->getClosingAt()?->format(\DateTimeInterface::ATOM),
            'resourceTypes' => $campaign->getResourceTypes(),
            'status' => $campaign->getStatus(),
            'statusLabel' => $campaign->getStatusLabel(),
            'createdAt' => $campaign->getCreatedAt()->format(\DateTimeInterface::ATOM),
            'updatedAt' => $campaign->getUpdatedAt()->format(\DateTimeInterface::ATOM),
        ];
    }
}
