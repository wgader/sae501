<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\Association;
use App\Entity\ReservationSalle;
use App\Entity\User;
use App\Exception\RoomReservationConflictException;
use App\Service\RoomReservationService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('IS_AUTHENTICATED_FULLY')]
final class RoomReservationController extends AbstractController
{
    public function __construct(
        private readonly RoomReservationService $reservationService,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    #[Route('/api/rooms/reservations', name: 'app_room_reservation_create_rooms', methods: ['POST'])]
    #[Route('/api/salles/reservations', name: 'app_room_reservation_create_salles', methods: ['POST'])]
    public function create(
        Request $request,
        #[CurrentUser] User $user,
    ): JsonResponse {
        $association = $user->getAssociation();
        if ($association === null) {
            // Permet à un compte agent/admin de tester ou réserver pour une association
            if ($this->isGranted('ROLE_ADMIN') || $user->getTypeCompte() === 'mairie') {
                $association = $this->entityManager->getRepository(Association::class)->findOneBy(['statut' => 'VALIDATED'])
                    ?? $this->entityManager->getRepository(Association::class)->findOneBy([]);
            }
        }

        if ($association === null) {
            return $this->json(
                ['message' => 'Votre compte n’est rattaché à aucune association.'],
                Response::HTTP_FORBIDDEN,
            );
        }

        // Vérification d'activation du module Salles pour les associations
        if ($user->getTypeCompte() !== 'mairie' && !$this->isGranted('ROLE_ADMIN') && !$association->isModuleSalleActif()) {
            return $this->json(
                ['message' => 'Le module salles n’est pas activé pour votre association.'],
                Response::HTTP_FORBIDDEN,
            );
        }

        $payload = $this->resolvePayload($request);

        $salleId = filter_var($payload['salleId'] ?? null, FILTER_VALIDATE_INT);
        if ($salleId === false || $salleId <= 0) {
            return $this->json(
                ['message' => 'Le paramètre salleId est obligatoire et doit être un entier positif.'],
                Response::HTTP_BAD_REQUEST,
            );
        }

        $motif = $payload['motifEvenement'] ?? null;
        if ($motif !== null && !is_string($motif)) {
            return $this->json(
                ['message' => 'Le motif de l’événement doit être une chaîne de caractères.'],
                Response::HTTP_BAD_REQUEST,
            );
        }
        $motif = is_string($motif) && trim($motif) !== '' ? trim($motif) : null;

        $startStr = $payload['dateDebut'] ?? null;
        $endStr = $payload['dateFin'] ?? null;

        if (!is_string($startStr) || trim($startStr) === '' || !is_string($endStr) || trim($endStr) === '') {
            return $this->json(
                ['message' => 'Les horaires de début et de fin sont obligatoires.'],
                Response::HTTP_BAD_REQUEST,
            );
        }

        try {
            $dateDebut = new \DateTimeImmutable($startStr);
            $dateFin = new \DateTimeImmutable($endStr);
        } catch (\Exception) {
            return $this->json(
                ['message' => 'Le format des dates de début ou de fin est invalide.'],
                Response::HTTP_BAD_REQUEST,
            );
        }

        $capaciteAttendue = null;
        if (isset($payload['capaciteAttendue']) && $payload['capaciteAttendue'] !== '' && $payload['capaciteAttendue'] !== null) {
            $capaciteAttendue = filter_var($payload['capaciteAttendue'], FILTER_VALIDATE_INT);
            if ($capaciteAttendue === false) {
                return $this->json(
                    ['message' => 'L’effectif attendu doit être un nombre entier.'],
                    Response::HTTP_BAD_REQUEST,
                );
            }
        }

        $justificatif = $request->files->get('justificatif') ?? $request->files->get('document');
        if ($justificatif !== null && !$justificatif instanceof UploadedFile) {
            return $this->json(
                ['message' => 'Le fichier justificatif transmis est invalide.'],
                Response::HTTP_BAD_REQUEST,
            );
        }

        try {
            $reservation = $this->reservationService->create(
                $association,
                $user,
                $salleId,
                $motif,
                $dateDebut,
                $dateFin,
                $capaciteAttendue,
                $justificatif,
            );

            return $this->json(
                self::serializeReservation($reservation),
                Response::HTTP_CREATED,
            );
        } catch (RoomReservationConflictException $exception) {
            return $this->json([
                'code' => 'ROOM_SLOT_CONFLICT',
                'message' => $exception->getMessage(),
                'conflicts' => $exception->getConflicts(),
            ], Response::HTTP_CONFLICT);
        } catch (\InvalidArgumentException $exception) {
            return $this->json([
                'message' => $exception->getMessage(),
            ], Response::HTTP_BAD_REQUEST);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function resolvePayload(Request $request): array
    {
        $contentType = (string) $request->headers->get('CONTENT_TYPE', '');
        if (str_contains($contentType, 'application/json')) {
            $decoded = json_decode($request->getContent(), true);
            return is_array($decoded) ? $decoded : [];
        }

        return $request->request->all();
    }

    /**
     * @return array<string, mixed>
     */
    public static function serializeReservation(ReservationSalle $reservation): array
    {
        $salle = $reservation->getSalle();

        return [
            'id' => $reservation->getId(),
            'statut' => $reservation->getStatut(),
            'motifEvenement' => $reservation->getMotifEvenement(),
            'dateDebut' => $reservation->getDateDebut()?->format(\DateTimeInterface::ATOM),
            'dateFin' => $reservation->getDateFin()?->format(\DateTimeInterface::ATOM),
            'capaciteAttendue' => $reservation->getCapaciteAttendue(),
            'createdAt' => $reservation->getCreatedAt()?->format(\DateTimeInterface::ATOM),
            'salle' => $salle !== null ? RoomCatalogController::serializeRoom($salle) : null,
            'message' => 'Votre demande de réservation a bien été enregistrée et est en attente de validation par la mairie.',
        ];
    }
}

