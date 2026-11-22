<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\User;
use App\Exception\CampaignWishValidationException;
use App\Exception\RoomBookingClosedException;
use App\Repository\CampaignRepository;
use App\Repository\CampaignWishSubmissionRepository;
use App\Security\ModuleVoter;
use App\Service\CampaignService;
use App\Service\CampaignWishService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Vœux de créneaux récurrents de l'association connectée pour la campagne annuelle des salles.
 */
#[Route('/api/campaigns/current/wishes')]
#[IsGranted(ModuleVoter::ROOMS)]
final class CampaignWishController extends AbstractController
{
    public function __construct(
        private readonly CampaignWishService $wishService,
        private readonly CampaignService $campaignService,
        private readonly CampaignRepository $campaignRepository,
        private readonly CampaignWishSubmissionRepository $submissionRepository,
    ) {
    }

    #[Route('', name: 'campaign_wishes_mine', methods: ['GET'])]
    public function mine(#[CurrentUser] User $user): JsonResponse
    {
        $association = $user->getAssociation();
        if (null === $association) {
            return $this->json(['message' => 'Votre compte n’est rattaché à aucune association.'], Response::HTTP_FORBIDDEN);
        }

        $now = new \DateTimeImmutable();
        $this->campaignService->synchronize($now);
        $campaign = $this->campaignRepository->findCurrentState($now);

        return $this->json([
            'campaign' => null === $campaign ? null : CampaignController::serializeCampaign($campaign),
            'submissions' => null === $campaign ? [] : array_map(
                CampaignWishService::serializeSubmission(...),
                $this->submissionRepository->findForAssociation($campaign, $association),
            ),
        ]);
    }

    #[Route('', name: 'campaign_wishes_submit', methods: ['POST'])]
    public function submit(Request $request, #[CurrentUser] User $user): JsonResponse
    {
        $association = $user->getAssociation();
        if (null === $association) {
            return $this->json(['message' => 'Seule une association peut déposer des vœux.'], Response::HTTP_FORBIDDEN);
        }

        $payload = json_decode($request->getContent(), true);
        try {
            $submission = $this->wishService->submit($association, $user, is_array($payload) ? ($payload['wishes'] ?? null) : null);
        } catch (RoomBookingClosedException $exception) {
            return $this->json(['code' => 'CAMPAIGN_CLOSED', 'message' => $exception->getMessage()], Response::HTTP_FORBIDDEN);
        } catch (CampaignWishValidationException $exception) {
            return $this->json(['message' => $exception->getMessage(), 'errors' => $exception->getErrors()], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        return $this->json(CampaignWishService::serializeSubmission($submission), Response::HTTP_CREATED);
    }
}
