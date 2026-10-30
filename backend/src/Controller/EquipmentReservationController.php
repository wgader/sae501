<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\ReservationMateriel;
use App\Entity\User;
use App\Exception\EquipmentReservationConflictException;
use App\Service\EquipmentReservationService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/equipment/reservations')]
#[IsGranted('ROLE_ASSOCIATION')]
final class EquipmentReservationController extends AbstractController
{
    public function __construct(
        private readonly EquipmentReservationService $reservationService,
    ) {
    }

    #[Route('', name: 'app_equipment_reservation_create', methods: ['POST'])]
    public function create(
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

        $payload = json_decode($request->getContent(), true);
        if (!is_array($payload)) {
            return $this->json(['message' => 'Le corps de la requête est invalide.'], Response::HTTP_BAD_REQUEST);
        }

        try {
            $motif = $this->requiredString($payload, 'motifEvenement');
            $start = $this->parseDate($this->requiredString($payload, 'dateRetrait'), 'La date de retrait est invalide.');
            $end = $this->parseDate($this->requiredString($payload, 'dateRestitution'), 'La date de restitution est invalide.');
            $lines = $this->parseLines($payload['lignes'] ?? null);
            $reservation = $this->reservationService->create($association, $motif, $start, $end, $lines);

            return $this->json(self::serializeReservation($reservation), Response::HTTP_CREATED);
        } catch (EquipmentReservationConflictException $exception) {
            return $this->json([
                'message' => $exception->getMessage(),
                'conflicts' => $exception->getConflicts(),
            ], Response::HTTP_CONFLICT);
        } catch (\InvalidArgumentException $exception) {
            return $this->json(['message' => $exception->getMessage()], Response::HTTP_UNPROCESSABLE_ENTITY);
        }
    }

    private function requiredString(array $payload, string $key): string
    {
        $value = $payload[$key] ?? null;
        if (!is_string($value) || trim($value) === '') {
            throw new \InvalidArgumentException(sprintf('Le champ "%s" est obligatoire.', $key));
        }

        return trim($value);
    }

    private function parseDate(string $value, string $message): \DateTimeImmutable
    {
        try {
            return new \DateTimeImmutable($value);
        } catch (\Exception) {
            throw new \InvalidArgumentException($message);
        }
    }

    /**
     * @return list<array{materielId: int, quantite: int}>
     */
    private function parseLines(mixed $value): array
    {
        if (!is_array($value)) {
            throw new \InvalidArgumentException('Le panier doit contenir au moins un équipement.');
        }

        $lines = [];
        foreach ($value as $line) {
            if (!is_array($line)) {
                throw new \InvalidArgumentException('Une ligne de réservation est invalide.');
            }

            $materielId = $line['materielId'] ?? null;
            $quantite = $line['quantite'] ?? null;
            if (!is_int($materielId) || $materielId <= 0 || !is_int($quantite) || $quantite <= 0) {
                throw new \InvalidArgumentException('Les équipements et quantités doivent être des entiers positifs.');
            }

            $lines[] = ['materielId' => $materielId, 'quantite' => $quantite];
        }

        return $lines;
    }

    /**
     * @return array<string, mixed>
     */
    private static function serializeReservation(ReservationMateriel $reservation): array
    {
        return [
            'id' => $reservation->getId(),
            'statut' => $reservation->getStatut(),
            'motifEvenement' => $reservation->getMotifEvenement(),
            'dateRetrait' => $reservation->getDateRetrait()?->format(\DateTimeInterface::ATOM),
            'dateRestitution' => $reservation->getDateRestitution()?->format(\DateTimeInterface::ATOM),
            'lignes' => array_map(
                static fn ($line): array => [
                    'materielId' => $line->getMateriel()?->getId(),
                    'designation' => $line->getMateriel()?->getDesignation(),
                    'quantite' => $line->getQuantite(),
                ],
                $reservation->getLignes()->toArray(),
            ),
        ];
    }
}
