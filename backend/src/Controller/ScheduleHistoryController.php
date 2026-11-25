<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\Association;
use App\Entity\User;
use App\Repository\AssociationRepository;
use App\Service\ScheduleHistoryService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('IS_AUTHENTICATED_FULLY')]
final class ScheduleHistoryController extends AbstractController
{
    public function __construct(
        private readonly ScheduleHistoryService $historyService,
        private readonly AssociationRepository $associationRepository,
    ) {
    }

    #[Route('/api/schedules/history', name: 'app_schedule_history', methods: ['GET'])]
    public function history(Request $request, #[CurrentUser] User $user): JsonResponse
    {
        $association = $this->resolveAssociation($request, $user);
        if ($association instanceof JsonResponse) {
            return $association;
        }

        return $this->json($this->historyService->build($association));
    }

    private function resolveAssociation(Request $request, User $user): Association|JsonResponse
    {
        if ('association' === $user->getTypeCompte()) {
            $association = $user->getAssociation();
            if (null === $association) {
                return $this->json(
                    ['message' => 'Votre compte n’est rattaché à aucune association.'],
                    Response::HTTP_FORBIDDEN,
                );
            }

            return $association;
        }

        $isMairie = $this->isGranted('ROLE_MAIRIE')
            || $this->isGranted('ROLE_ADMIN')
            || $this->isGranted('ROLE_GESTION_SALLE')
            || $this->isGranted('ROLE_GESTION_MATERIEL');
        if (!$isMairie) {
            return $this->json(
                ['message' => 'Seuls les comptes Association et Mairie peuvent consulter cet historique.'],
                Response::HTTP_FORBIDDEN,
            );
        }

        $rawId = $request->query->get('asso_id');
        $associationId = filter_var($rawId, FILTER_VALIDATE_INT);
        if (!is_int($associationId) || $associationId <= 0) {
            return $this->json(
                ['message' => 'Le paramètre asso_id est obligatoire pour un agent Mairie.'],
                Response::HTTP_BAD_REQUEST,
            );
        }

        $association = $this->associationRepository->find($associationId);
        if (null === $association) {
            return $this->json(
                ['message' => 'Association introuvable.'],
                Response::HTTP_NOT_FOUND,
            );
        }

        return $association;
    }
}
