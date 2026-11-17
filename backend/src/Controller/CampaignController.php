<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\Campaign;
use App\Repository\CampaignRepository;
use App\Repository\ReservationSalleRepository;
use App\Service\CampaignService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\ExpressionLanguage\Expression;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
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

    #[Route('/api/admin/campaigns/{id}/reopen', name: 'admin_campaign_reopen', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function reopen(Campaign $campaign, Request $request): JsonResponse
    {
        $payload = json_decode($request->getContent() ?: '{}', true);
        $value = \is_array($payload) ? ($payload['closingAt'] ?? null) : null;

        try {
            $closingAt = \is_string($value) && '' !== $value ? new \DateTimeImmutable($value) : null;

            return $this->json(self::serializeCampaign($this->campaignService->reopen($campaign, $closingAt)));
        } catch (\DomainException $exception) {
            return $this->json(['message' => $exception->getMessage()], Response::HTTP_CONFLICT);
        } catch (\InvalidArgumentException $exception) {
            return $this->json(['message' => $exception->getMessage()], Response::HTTP_UNPROCESSABLE_ENTITY);
        } catch (\Exception) {
            return $this->json(['message' => 'La date de clôture est invalide.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }
    }

    /**
     * Historique : chaque campagne avec son bilan, la plus récente d’abord.
     */
    #[Route('/api/admin/campaign-history', name: 'admin_campaign_history', methods: ['GET'])]
    public function history(CampaignRepository $campaigns, ReservationSalleRepository $reservations): JsonResponse
    {
        $totals = $reservations->campaignTotals();

        return $this->json(array_map(
            static fn (Campaign $campaign): array => self::serializeCampaign($campaign) + [
                'totals' => $totals[(int) $campaign->getId()] ?? ['requests' => 0, 'accepted' => 0, 'rooms' => 0],
            ],
            $campaigns->findAllOrdered(),
        ));
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
            // Période effective : celle saisie, sinon l’année civile qui suit l’ouverture.
            'periodStart' => $campaign->getEffectivePeriodStart()?->format('Y-m-d'),
            'periodEnd' => $campaign->getEffectivePeriodEnd()?->format('Y-m-d'),
            'resourceTypes' => $campaign->getResourceTypes(),
            'status' => $campaign->getStatus(),
            'statusLabel' => $campaign->getStatusLabel(),
            'createdAt' => $campaign->getCreatedAt()->format(\DateTimeInterface::ATOM),
            'updatedAt' => $campaign->getUpdatedAt()->format(\DateTimeInterface::ATOM),
        ];
    }
}
