<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\ReservationSalle;
use App\Entity\User;
use App\Repository\CampaignRepository;
use App\Repository\ReservationSalleRepository;
use App\Service\CampaignRequestService;
use App\Service\CampaignService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/campaigns')]
#[IsGranted('ROLE_USER')]
final class CurrentCampaignController extends AbstractController
{
    public function __construct(
        private readonly CampaignRepository $repository,
        private readonly CampaignService $campaignService,
        private readonly ReservationSalleRepository $reservationRepository,
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

    /**
     * Demandes de l’association connectée pour la campagne en cours (ou la dernière clôturée).
     */
    #[Route('/current/requests', name: 'campaign_current_requests', methods: ['GET'])]
    public function myRequests(#[CurrentUser] User $user): JsonResponse
    {
        $association = $user->getAssociation();
        if (null === $association) {
            return $this->json(['message' => 'Votre compte n’est rattaché à aucune association.'], Response::HTTP_FORBIDDEN);
        }

        $this->campaignService->synchronize(new \DateTimeImmutable());
        $campaign = $this->repository->findCurrentState(new \DateTimeImmutable());
        $requests = null === $campaign
            ? []
            : $this->reservationRepository->findBy(['campaign' => $campaign, 'association' => $association], ['dateDebut' => 'ASC']);

        return $this->json([
            'campaign' => null === $campaign ? null : CampaignController::serializeCampaign($campaign),
            'requests' => array_map(static fn (ReservationSalle $reservation): array => CampaignRequestService::serialize($reservation), $requests),
        ]);
    }
}
