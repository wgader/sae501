<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\AppSettings;
use App\Entity\Salle;
use App\Repository\SalleRepository;
use App\Security\ModuleVoter;
use App\Service\AppSettingsService;
use App\Service\RoomReservationService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted(ModuleVoter::ROOMS)]
final class RoomCatalogController extends AbstractController
{
    public function __construct(
        private readonly SalleRepository $salleRepository,
        private readonly RoomReservationService $reservationService,
        private readonly AppSettingsService $settings,
    ) {
    }

    #[Route('/api/rooms', name: 'app_room_catalog_rooms', methods: ['GET'])]
    #[Route('/api/salles', name: 'app_room_catalog_salles', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $rooms = $this->salleRepository->findAvailableForCatalog();

        return $this->json(array_map(
            fn (Salle $salle): array => self::serializeRoom($salle, $this->settings->current()),
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
    public static function serializeRoom(Salle $salle, AppSettings $settings): array
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
                'debut' => sprintf('%02d:00', $settings->getRoomOpeningHour()),
                'fin' => sprintf('%02d:00', $settings->getRoomClosingHour()),
            ],
            'isActive' => $salle->isActive(),
        ];
    }
}
