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
use Symfony\Component\HttpFoundation\Request;
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
     * Endpoint léger pour la vue cartographique interactive avec filtres dynamiques.
     */
    #[Route('/api/rooms/map', name: 'app_room_catalog_map', methods: ['GET'])]
    public function map(Request $request): JsonResponse
    {
        $capacityMin = $request->query->get('capacity_min');
        $pmrParam = $request->query->get('pmr');
        $typologie = $request->query->get('typologie');
        $amenities = $request->query->all('amenities');
        $bboxParam = $request->query->get('bbox');

        $bbox = null;
        if (is_string($bboxParam) && '' !== trim($bboxParam)) {
            $parts = array_map('trim', explode(',', $bboxParam));
            if (4 === count($parts) && [] === array_filter($parts, static fn (string $v): bool => !is_numeric($v))) {
                $bbox = array_map('floatval', $parts);
            }
        }

        $filters = [
            'capacity_min' => is_numeric($capacityMin) ? (int) $capacityMin : null,
            'pmr' => filter_var($pmrParam, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE),
            'typologie' => is_string($typologie) && '' !== $typologie ? $typologie : null,
            'amenities' => is_array($amenities) ? array_values(array_filter($amenities, 'is_string')) : [],
            'bbox' => $bbox,
        ];

        $rooms = $this->salleRepository->findForMap($filters);

        return $this->json(array_map(
            static fn (Salle $salle): array => [
                'id' => $salle->getId(),
                'nom' => $salle->getNom(),
                'adresse' => $salle->getAdresse(),
                'imageUrl' => $salle->getImagePath(),
                'capaciteMax' => $salle->getCapaciteMax(),
                'accesPmr' => $salle->isAccesPmr(),
                'typologie' => $salle->getTypologie(),
                'equipementsInclus' => $salle->getEquipementsInclus(),
                'latitude' => $salle->getLatitude(),
                'longitude' => $salle->getLongitude(),
            ],
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
            'typologie' => $salle->getTypologie(),
            'equipementsInclus' => $salle->getEquipementsInclus(),
            'latitude' => $salle->getLatitude(),
            'longitude' => $salle->getLongitude(),
            'horairesOuverture' => [
                'debut' => sprintf('%02d:00', $settings->getRoomOpeningHour()),
                'fin' => sprintf('%02d:00', $settings->getRoomClosingHour()),
            ],
            'isActive' => $salle->isActive(),
        ];
    }
}