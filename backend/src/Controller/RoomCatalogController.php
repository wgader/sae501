<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\Salle;
use App\Repository\SalleRepository;
use App\Service\RoomReservationService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

final class RoomCatalogController extends AbstractController
{
    public function __construct(
        private readonly SalleRepository $salleRepository,
        private readonly RoomReservationService $reservationService,
    ) {
    }

    #[Route('/api/rooms', name: 'app_room_catalog_rooms', methods: ['GET'])]
    #[Route('/api/salles', name: 'app_room_catalog_salles', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $rooms = $this->salleRepository->findAvailableForCatalog();

        return $this->json(array_map(
            static fn (Salle $salle): array => self::serializeRoom($salle),
            $rooms,
        ));
    }

    /**
     * Règles des réservations ponctuelles : dernier jour réservable, durée maximale, pas des horaires.
     */
    #[Route('/api/rooms/booking-rules', name: 'app_room_catalog_booking_rules', methods: ['GET'])]
    public function bookingRules(): JsonResponse
    {
        return $this->json($this->reservationService->oneOffRules());
    }

    /**
     * @return array<string, mixed>
     */
    public static function serializeRoom(Salle $salle): array
    {
        return [
            'id' => $salle->getId(),
            'nom' => $salle->getNom(),
            'description' => $salle->getDescription(),
            'imageUrl' => $salle->getImagePath(),
            'adresse' => $salle->getAdresse(),
            'capaciteMax' => $salle->getCapaciteMax(),
            'accesPmr' => $salle->isAccesPmr(),
            'equipementsInclus' => $salle->getEquipementsInclus(),
            'horairesOuverture' => [
                'debut' => sprintf('%02d:00', RoomReservationService::OPENING_HOUR),
                'fin' => sprintf('%02d:00', RoomReservationService::CLOSING_HOUR),
            ],
            'isActive' => $salle->isActive(),
        ];
    }
}

