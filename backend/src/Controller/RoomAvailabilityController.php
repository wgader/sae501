<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\Association;
use App\Entity\ReservationSalle;
use App\Entity\Salle;
use App\Entity\User;
use App\Repository\AssociationRepository;
use App\Repository\ReservationSalleRepository;
use App\Repository\SalleRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('IS_AUTHENTICATED_FULLY')]
final class RoomAvailabilityController extends AbstractController
{
    public function __construct(
        private readonly SalleRepository $salleRepository,
        private readonly ReservationSalleRepository $reservationSalleRepository,
        private readonly AssociationRepository $associationRepository,
    ) {
    }

    #[Route('/api/rooms/{id}/availability', name: 'app_room_availability_rooms', methods: ['GET'])]
    #[Route('/api/salles/{id}/availability', name: 'app_room_availability_salles', methods: ['GET'])]
    public function availability(
        int $id,
        Request $request,
        #[CurrentUser] User $user,
    ): JsonResponse {
        $association = $user->getAssociation();
        if ($association === null && ($this->isGranted('ROLE_ADMIN') || $user->getTypeCompte() === 'mairie')) {
            $association = $this->associationRepository->findOneBy(['statut' => 'VALIDATED'])
                ?? $this->associationRepository->findOneBy([]);
        }

        if ($association !== null && $user->getTypeCompte() !== 'mairie' && !$this->isGranted('ROLE_ADMIN') && !$association->isModuleSalleActif()) {
            return $this->json(
                ['message' => 'Le module salles n’est pas activé pour votre association.'],
                Response::HTTP_FORBIDDEN,
            );
        }

        $salle = $this->salleRepository->find($id);
        if ($salle === null || !$salle->isActive() || $salle->getDeletedAt() !== null) {
            return $this->json(
                ['message' => 'La salle demandée est introuvable ou indisponible.'],
                Response::HTTP_NOT_FOUND,
            );
        }

        $startQuery = $request->query->get('start');
        $endQuery = $request->query->get('end');

        try {
            $startDate = is_string($startQuery) && trim($startQuery) !== ''
                ? new \DateTimeImmutable($startQuery)
                : (new \DateTimeImmutable('first day of this month 00:00:00'));

            $endDate = is_string($endQuery) && trim($endQuery) !== ''
                ? new \DateTimeImmutable($endQuery)
                : (new \DateTimeImmutable('last day of next month 23:59:59'));
        } catch (\Exception) {
            return $this->json(
                ['message' => 'Les paramètres start et/ou end sont au format invalide.'],
                Response::HTTP_BAD_REQUEST,
            );
        }

        if ($endDate <= $startDate) {
            return $this->json(
                ['message' => 'La date de fin doit être postérieure à la date de début.'],
                Response::HTTP_BAD_REQUEST,
            );
        }

        $reservations = $this->reservationSalleRepository->findActiveReservationsInInterval(
            $salle,
            $startDate,
            $endDate,
        );

        $occupiedSlots = array_map(static function (ReservationSalle $res): array {
            $statut = $res->getStatut();
            $isPreReserved = in_array($statut, [
                'En attente de validation par la mairie',
                'En attente',
                'En cours de traitement',
            ], true);

            return [
                'id' => $res->getId(),
                'start' => $res->getDateDebut()?->format(\DateTimeInterface::ATOM),
                'end' => $res->getDateFin()?->format(\DateTimeInterface::ATOM),
                'statut' => $statut,
                'isPreReserved' => $isPreReserved,
            ];
        }, $reservations);

        return $this->json([
            'room' => RoomCatalogController::serializeRoom($salle),
            'start' => $startDate->format(\DateTimeInterface::ATOM),
            'end' => $endDate->format(\DateTimeInterface::ATOM),
            'occupiedSlots' => $occupiedSlots,
        ]);
    }
}

