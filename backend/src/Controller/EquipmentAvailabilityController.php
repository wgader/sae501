<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\Materiel;
use App\Entity\User;
use App\Repository\ReservationMaterielRepository;
use App\Service\EquipmentAvailabilityService;
use App\Service\EquipmentReservationService;
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
        private readonly ReservationMaterielRepository $reservationRepository,
    ) {
    }

    /**
     * Stock engagé jour après jour et règles de réservation, pour construire le calendrier.
     */
    #[Route('/{id}/occupancy', name: 'app_equipment_occupancy', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function occupancy(Materiel $materiel, #[CurrentUser] User $user): JsonResponse
    {
        $association = $user->getAssociation();
        if ($association === null || !$association->isModuleMaterielActif()) {
            return $this->json(
                ['message' => 'Le module matériel n’est pas activé pour votre association.'],
                Response::HTTP_FORBIDDEN,
            );
        }
        if ($materiel->isArchived()) {
            return $this->json(['message' => 'Cet équipement n’est plus disponible.'], Response::HTTP_NOT_FOUND);
        }

        $now = new \DateTimeImmutable();
        $lastDay = $now->modify(EquipmentReservationService::BOOKING_HORIZON);

        return $this->json([
            'stockTotal' => $materiel->getStockTotal(),
            'maxConsecutiveDays' => $materiel->getMaxConsecutiveDays(),
            'lastDay' => $lastDay->format('Y-m-d'),
            'reservations' => array_map(
                static fn (array $period): array => [
                    'start' => $period['start']->format(\DateTimeInterface::ATOM),
                    'end' => $period['end']->format(\DateTimeInterface::ATOM),
                    'quantite' => $period['quantite'],
                ],
                $this->reservationRepository->findEngagedPeriods($materiel, $now, $lastDay),
            ),
        ]);
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
