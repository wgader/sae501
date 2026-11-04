<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\ReservationMateriel;
use App\Entity\ReservationMaterielLigne;
use App\Service\EquipmentReservationAdministrationService;
use App\Repository\ReservationMaterielRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\ExpressionLanguage\Expression;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/admin/equipment/reservations')]
#[IsGranted(new Expression("is_granted('ROLE_ADMIN') or is_granted('ROLE_GESTION_MATERIEL')"))]
final class EquipmentReservationAdministrationController extends AbstractController
{
    public function __construct(
        private readonly ReservationMaterielRepository $reservationRepository,
        private readonly EquipmentReservationAdministrationService $administrationService,
    ) {
    }

    #[Route('', name: 'admin_equipment_reservation_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $page = max(1, (int) $request->query->get('page', 1));
        $itemsPerPage = min(50, max(1, (int) $request->query->get('itemsPerPage', 10)));
        $status = $request->query->get('status');
        $search = $request->query->get('q');
        $status = is_string($status) && in_array($status, ReservationMateriel::STATUTS, true) ? $status : null;
        $search = is_string($search) ? $search : null;

        $totalItems = $this->reservationRepository->countForAdministration($status, $search);

        return $this->json([
            'items' => array_map(
                [self::class, 'serializeReservation'],
                $this->reservationRepository->findForAdministration($status, $page, $itemsPerPage, $search),
            ),
            'page' => $page,
            'itemsPerPage' => $itemsPerPage,
            'totalItems' => $totalItems,
            'counts' => $this->reservationRepository->getCountsForAdministration(),
        ]);
    }

    #[Route('/{id}', name: 'admin_equipment_reservation_show', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function show(ReservationMateriel $reservation): JsonResponse
    {
        return $this->json(self::serializeReservation($reservation));
    }

    #[Route('/{id}/status', name: 'admin_equipment_reservation_status', methods: ['PATCH'], requirements: ['id' => '\d+'])]
    public function updateStatus(ReservationMateriel $reservation, Request $request): JsonResponse
    {
        $payload = json_decode($request->getContent(), true);
        if (!is_array($payload)) {
            return $this->json(['message' => 'Le corps de la requête est invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $status = $payload['status'] ?? null;
        if (!is_string($status)) {
            return $this->json(['message' => 'Le statut est obligatoire.'], Response::HTTP_BAD_REQUEST);
        }
        $noteInterne = isset($payload['noteInterne']) && is_string($payload['noteInterne'])
            ? trim($payload['noteInterne'])
            : null;

        try {
            $updated = $this->administrationService->updateStatus($reservation, $status, $noteInterne);
        } catch (\InvalidArgumentException $exception) {
            return $this->json(['message' => $exception->getMessage()], Response::HTTP_UNPROCESSABLE_ENTITY);
        } catch (\DomainException $exception) {
            return $this->json(['message' => $exception->getMessage()], Response::HTTP_CONFLICT);
        }

        return $this->json(self::serializeReservation($updated));
    }

    /**
     * @return array<string, mixed>
     */
    public static function serializeReservation(ReservationMateriel $reservation): array
    {
        $association = $reservation->getAssociation();
        $contact = $association?->getUsers()->first();
        $contact = $contact === false ? null : $contact;

        return [
            'id' => $reservation->getId(),
            'statut' => $reservation->getStatut(),
            'motifEvenement' => $reservation->getMotifEvenement(),
            'dateRetrait' => $reservation->getDateRetrait()?->format(\DateTimeInterface::ATOM),
            'dateRestitution' => $reservation->getDateRestitution()?->format(\DateTimeInterface::ATOM),
            'createdAt' => $reservation->getCreatedAt()?->format(\DateTimeInterface::ATOM),
            'updatedAt' => $reservation->getUpdatedAt()?->format(\DateTimeInterface::ATOM),
            'noteInterne' => $reservation->getNoteInterne(),
            'association' => [
                'id' => $association?->getId(),
                'nom' => $association?->getNom(),
                'contact' => [
                    'nom' => $contact?->getNom(),
                    'prenom' => $contact?->getPrenom(),
                    'email' => $contact?->getEmail(),
                    'telephone' => $contact?->getTelephone(),
                ],
            ],
            'lignes' => array_map(
                static fn (ReservationMaterielLigne $line): array => [
                    'materielId' => $line->getMateriel()?->getId(),
                    'designation' => $line->getMateriel()?->getDesignation(),
                    'quantite' => $line->getQuantite(),
                ],
                $reservation->getLignes()->toArray(),
            ),
        ];
    }
}
