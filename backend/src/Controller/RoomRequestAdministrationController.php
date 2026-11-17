<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\ReservationSalle;
use App\Entity\User;
use App\Exception\RoomReservationConflictException;
use App\Repository\ReservationSalleRepository;
use App\Service\AssociationRequestCancellationService;
use App\Service\CampaignRequestService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\ExpressionLanguage\Expression;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Traitement par la mairie des réservations ponctuelles de salle, déposées hors campagne.
 */
#[Route('/api/admin/room-requests')]
#[IsGranted(new Expression("is_granted('ROLE_ADMIN') or is_granted('ROLE_GESTION_SALLE')"))]
final class RoomRequestAdministrationController extends AbstractController
{
    public function __construct(
        private readonly ReservationSalleRepository $repository,
        private readonly CampaignRequestService $requestService,
        private readonly AssociationRequestCancellationService $cancellationService,
    ) {
    }

    #[Route('', name: 'admin_room_requests', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $requests = $this->repository->findOneOffRequests();

        return $this->json([
            'requests' => array_map(
                static fn (ReservationSalle $reservation): array => CampaignRequestService::serialize($reservation, $requests),
                $requests,
            ),
        ]);
    }

    #[Route('/{id<\d+>}/accept', name: 'admin_room_request_accept', methods: ['POST'])]
    public function accept(int $id): JsonResponse
    {
        $reservation = $this->findOneOff($id);

        return $this->handle(fn (): array => CampaignRequestService::serialize($this->requestService->accept($reservation, $this->agent())));
    }

    #[Route('/{id<\d+>}/refuse', name: 'admin_room_request_refuse', methods: ['POST'])]
    public function refuse(int $id, Request $request): JsonResponse
    {
        $reservation = $this->findOneOff($id);
        $reason = $this->reason($request);

        return $this->handle(fn (): array => CampaignRequestService::serialize($this->requestService->refuse($reservation, $this->agent(), $reason)));
    }

    #[Route('/{id<\d+>}/cancel', name: 'admin_room_request_cancel', methods: ['POST'])]
    public function cancel(int $id, Request $request): JsonResponse
    {
        $reservation = $this->findOneOff($id);
        $reason = $this->reason($request);

        return $this->handle(fn (): array => CampaignRequestService::serialize(
            $this->cancellationService->cancelByTownHall($reservation, $this->agent(), $reason),
        ));
    }

    /**
     * @param callable(): array<string, mixed> $action
     */
    private function handle(callable $action): JsonResponse
    {
        try {
            return $this->json($action());
        } catch (RoomReservationConflictException $exception) {
            return $this->json(['message' => $exception->getMessage(), 'conflicts' => $exception->getConflicts()], Response::HTTP_CONFLICT);
        } catch (\DomainException $exception) {
            return $this->json(['message' => $exception->getMessage()], Response::HTTP_CONFLICT);
        } catch (\InvalidArgumentException $exception) {
            return $this->json(['message' => $exception->getMessage()], Response::HTTP_UNPROCESSABLE_ENTITY);
        }
    }

    private function reason(Request $request): ?string
    {
        $payload = json_decode($request->getContent() ?: '{}', true);
        $reason = \is_array($payload) ? ($payload['reason'] ?? null) : null;

        return \is_string($reason) ? $reason : null;
    }

    private function findOneOff(int $id): ReservationSalle
    {
        $reservation = $this->repository->find($id);
        if (null === $reservation || null !== $reservation->getCampaign()) {
            throw $this->createNotFoundException('Réservation ponctuelle introuvable.');
        }

        return $reservation;
    }

    private function agent(): User
    {
        $user = $this->getUser();
        if (!$user instanceof User) {
            throw $this->createAccessDeniedException();
        }

        return $user;
    }
}
