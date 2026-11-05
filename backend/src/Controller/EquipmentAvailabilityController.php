<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\User;
use App\Service\EquipmentAvailabilityService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/equipment')]
#[IsGranted('ROLE_ASSOCIATION')]
final class EquipmentAvailabilityController extends AbstractController
{
    public function __construct(
        private readonly EquipmentAvailabilityService $availabilityService,
    ) {
    }

    #[Route('/availability', name: 'app_equipment_availability', methods: ['GET'])]
    public function availability(
        Request $request,
        #[CurrentUser] User $user,
    ): JsonResponse {
        $association = $user->getAssociation();

        if ($association === null || !$association->isModuleMaterielActif()) {
            return $this->json(
                ['message' => 'Le module matériel n’est pas activé pour votre association.'],
                Response::HTTP_FORBIDDEN,
            );
        }

        $start = $request->query->get('start');
        $end = $request->query->get('end');

        if (!is_string($start) || !is_string($end) || trim($start) === '' || trim($end) === '') {
            return $this->json(
                ['message' => 'Les paramètres start et end sont obligatoires.'],
                Response::HTTP_BAD_REQUEST,
            );
        }

        try {
            return $this->json([
                'start' => $start,
                'end' => $end,
                'items' => $this->availabilityService->getAvailability($start, $end),
            ]);
        } catch (\InvalidArgumentException $exception) {
            return $this->json(
                ['message' => $exception->getMessage()],
                Response::HTTP_UNPROCESSABLE_ENTITY,
            );
        }
    }
}
