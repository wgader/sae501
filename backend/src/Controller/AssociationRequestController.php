<?php

namespace App\Controller;

use App\Entity\User;
use App\Service\AssociationRequestAggregationService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/association/requests')]
final class AssociationRequestController extends AbstractController
{
    public function __construct(
        private readonly AssociationRequestAggregationService $aggregationService,
    ) {
    }

    #[Route('', name: 'app_association_requests_list', methods: ['GET'])]
    public function list(Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) {
            return $this->json(
                ['message' => 'Authentification requise pour accéder aux démarches.'],
                Response::HTTP_UNAUTHORIZED,
            );
        }

        $association = $user->getAssociation();
        if ($association === null) {
            return $this->json(
                ['message' => "Votre compte n'est rattaché à aucune association."],
                Response::HTTP_FORBIDDEN,
            );
        }

        $filters = [
            'status' => $request->query->get('status'),
            'type' => $request->query->get('type'),
            'year' => $request->query->get('year'),
            'search' => $request->query->get('search'),
            'page' => $request->query->getInt('page', 1),
            'limit' => $request->query->getInt('limit', 10),
        ];

        $data = $this->aggregationService->getConsolidatedRequests($association, $filters);

        return $this->json($data);
    }

    #[Route('/{id}', name: 'app_association_requests_show', methods: ['GET'])]
    public function show(string $id, Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) {
            return $this->json(
                ['message' => 'Authentification requise pour accéder à cette démarche.'],
                Response::HTTP_UNAUTHORIZED,
            );
        }

        $association = $user->getAssociation();
        if ($association === null) {
            return $this->json(
                ['message' => "Votre compte n'est rattaché à aucune association."],
                Response::HTTP_FORBIDDEN,
            );
        }

        try {
            $type = $request->query->get('type');
            $detail = $this->aggregationService->getRequestDetail($association, $id, is_string($type) ? $type : null);

            if ($detail === null) {
                return $this->json(
                    ['message' => 'Dossier introuvable.'],
                    Response::HTTP_NOT_FOUND,
                );
            }

            return $this->json($detail);
        } catch (AccessDeniedException $e) {
            return $this->json(
                ['message' => $e->getMessage()],
                Response::HTTP_FORBIDDEN,
            );
        }
    }
}

