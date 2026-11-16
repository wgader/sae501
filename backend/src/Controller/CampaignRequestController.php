<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\Association;
use App\Entity\Campaign;
use App\Entity\ReservationSalle;
use App\Entity\Salle;
use App\Entity\User;
use App\Exception\RoomReservationConflictException;
use App\Service\CampaignRequestService;
use App\Service\CampaignService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\ExpressionLanguage\Expression;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Gestion par la mairie des demandes de salle d’une campagne annuelle et de ses dates.
 */
#[Route('/api/admin/campaigns/{id<\d+>}')]
#[IsGranted(new Expression("is_granted('ROLE_ADMIN') or is_granted('ROLE_GESTION_SALLE')"))]
final class CampaignRequestController extends AbstractController
{
    private const SLOT_FORMAT = 'Y-m-d\\TH:i:s';

    public function __construct(
        private readonly CampaignRequestService $requestService,
        private readonly CampaignService $campaignService,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    #[Route('/schedule', name: 'admin_campaign_schedule', methods: ['PATCH'])]
    public function schedule(Campaign $campaign, Request $request): JsonResponse
    {
        $payload = $this->payload($request);

        return $this->handle(fn (): array => CampaignController::serializeCampaign($this->campaignService->reschedule(
            $campaign,
            $this->dateField($payload, 'openingAt'),
            $this->dateField($payload, 'closingAt'),
        )));
    }

    #[Route('/requests', name: 'admin_campaign_requests', methods: ['GET'])]
    public function list(Campaign $campaign): JsonResponse
    {
        $requests = $this->requestService->listRequests($campaign);

        return $this->json([
            'campaign' => CampaignController::serializeCampaign($campaign),
            'requests' => array_map(
                fn (ReservationSalle $reservation): array => $this->serializeRequest($reservation, $requests),
                $requests,
            ),
        ]);
    }

    #[Route('/requests', name: 'admin_campaign_request_add', methods: ['POST'])]
    public function add(Campaign $campaign, Request $request): JsonResponse
    {
        $payload = $this->payload($request);

        return $this->handle(fn (): array => $this->serializeRequest($this->requestService->addSlot(
            $campaign,
            $this->agent(),
            $this->findOr404(Association::class, $payload['associationId'] ?? null, 'Association introuvable.'),
            $this->findOr404(Salle::class, $payload['salleId'] ?? null, 'Salle introuvable.'),
            $this->slotField($payload, 'dateDebut'),
            $this->slotField($payload, 'dateFin'),
            \is_string($payload['motifEvenement'] ?? null) ? $payload['motifEvenement'] : '',
        )), Response::HTTP_CREATED);
    }

    #[Route('/requests/{requestId<\d+>}/accept', name: 'admin_campaign_request_accept', methods: ['POST'])]
    public function accept(Campaign $campaign, int $requestId): JsonResponse
    {
        $reservation = $this->findRequest($campaign, $requestId);

        return $this->handle(fn (): array => $this->serializeRequest($this->requestService->accept($reservation, $this->agent())));
    }

    #[Route('/requests/{requestId<\d+>}/refuse', name: 'admin_campaign_request_refuse', methods: ['POST'])]
    public function refuse(Campaign $campaign, int $requestId, Request $request): JsonResponse
    {
        $reservation = $this->findRequest($campaign, $requestId);
        $reason = $this->payload($request)['reason'] ?? null;

        return $this->handle(fn (): array => $this->serializeRequest(
            $this->requestService->refuse($reservation, $this->agent(), \is_string($reason) ? $reason : null),
        ));
    }

    #[Route('/requests/{requestId<\d+>}', name: 'admin_campaign_request_reschedule', methods: ['PATCH'])]
    public function reschedule(Campaign $campaign, int $requestId, Request $request): JsonResponse
    {
        $reservation = $this->findRequest($campaign, $requestId);
        $payload = $this->payload($request);
        $reason = $payload['reason'] ?? null;

        return $this->handle(fn (): array => $this->serializeRequest($this->requestService->reschedule(
            $reservation,
            $this->agent(),
            $this->findOr404(Salle::class, $payload['salleId'] ?? null, 'Salle introuvable.'),
            $this->slotField($payload, 'dateDebut'),
            $this->slotField($payload, 'dateFin'),
            \is_string($reason) ? $reason : null,
        )));
    }

    /**
     * @param callable(): array<string, mixed> $action
     */
    private function handle(callable $action, int $status = Response::HTTP_OK): JsonResponse
    {
        try {
            return $this->json($action(), $status);
        } catch (RoomReservationConflictException $exception) {
            return $this->json(['message' => $exception->getMessage(), 'conflicts' => $exception->getConflicts()], Response::HTTP_CONFLICT);
        } catch (\DomainException $exception) {
            return $this->json(['message' => $exception->getMessage()], Response::HTTP_CONFLICT);
        } catch (\InvalidArgumentException $exception) {
            return $this->json(['message' => $exception->getMessage()], Response::HTTP_UNPROCESSABLE_ENTITY);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(Request $request): array
    {
        try {
            $payload = json_decode($request->getContent() ?: '{}', true, 16, \JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            throw $this->createBadRequest();
        }
        if (!\is_array($payload)) {
            throw $this->createBadRequest();
        }

        return $payload;
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function dateField(array $payload, string $field): \DateTimeImmutable
    {
        $value = $payload[$field] ?? null;
        if (!\is_string($value) || '' === trim($value)) {
            throw new \InvalidArgumentException(\sprintf('Le champ « %s » est obligatoire.', $field));
        }
        try {
            return new \DateTimeImmutable($value);
        } catch (\Exception) {
            throw new \InvalidArgumentException(\sprintf('Le champ « %s » n’est pas une date valide.', $field));
        }
    }

    /**
     * Les créneaux de salle sont des heures locales (« de 18h à 20h ») : le décalage horaire
     * éventuel est ignoré pour enregistrer et afficher partout la même heure.
     *
     * @param array<string, mixed> $payload
     */
    private function slotField(array $payload, string $field): \DateTimeImmutable
    {
        return new \DateTimeImmutable($this->dateField($payload, $field)->format('Y-m-d H:i:s'));
    }

    /**
     * @template T of object
     *
     * @param class-string<T> $class
     *
     * @return T
     */
    private function findOr404(string $class, mixed $id, string $message): object
    {
        $entity = is_numeric($id) ? $this->entityManager->find($class, (int) $id) : null;
        if (null === $entity) {
            throw $this->createNotFoundException($message);
        }

        return $entity;
    }

    private function findRequest(Campaign $campaign, int $requestId): ReservationSalle
    {
        $reservation = $this->entityManager->find(ReservationSalle::class, $requestId);
        if (null === $reservation || $reservation->getCampaign()?->getId() !== $campaign->getId()) {
            throw $this->createNotFoundException('Demande introuvable dans cette campagne.');
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

    private function createBadRequest(): \Symfony\Component\HttpKernel\Exception\BadRequestHttpException
    {
        return new \Symfony\Component\HttpKernel\Exception\BadRequestHttpException('Le corps de la requête est invalide.');
    }

    /**
     * @param list<ReservationSalle> $siblings demandes de la campagne, pour signaler les chevauchements
     *
     * @return array<string, mixed>
     */
    private function serializeRequest(ReservationSalle $reservation, array $siblings = []): array
    {
        $association = $reservation->getAssociation();
        $salle = $reservation->getSalle();

        return [
            'id' => $reservation->getId(),
            'status' => self::statusKey($reservation->getStatut()),
            'statusLabel' => $reservation->getStatut(),
            'association' => ['id' => $association?->getId(), 'nom' => $association?->getNom()],
            'salle' => ['id' => $salle?->getId(), 'nom' => $salle?->getNom(), 'capaciteMax' => $salle?->getCapaciteMax()],
            'motifEvenement' => $reservation->getMotifEvenement(),
            'capaciteAttendue' => $reservation->getCapaciteAttendue(),
            // Heures locales, sans décalage : voir slotField().
            'dateDebut' => $reservation->getDateDebut()?->format(self::SLOT_FORMAT),
            'dateFin' => $reservation->getDateFin()?->format(self::SLOT_FORMAT),
            'decisionComment' => $reservation->getDecisionComment(),
            'createdAt' => $reservation->getCreatedAt()?->format(\DateTimeInterface::ATOM),
            'updatedAt' => $reservation->getUpdatedAt()?->format(\DateTimeInterface::ATOM),
            'conflictsWith' => self::overlappingIds($reservation, $siblings),
        ];
    }

    private static function statusKey(string $statut): string
    {
        return match ($statut) {
            CampaignRequestService::STATUS_ACCEPTED => 'accepted',
            CampaignRequestService::STATUS_REFUSED => 'refused',
            'Annulée', 'Clôturée' => 'closed',
            default => 'pending',
        };
    }

    /**
     * @param list<ReservationSalle> $siblings
     *
     * @return list<int>
     */
    private static function overlappingIds(ReservationSalle $reservation, array $siblings): array
    {
        if ('refused' === self::statusKey($reservation->getStatut())) {
            return [];
        }

        $ids = [];
        foreach ($siblings as $other) {
            if (
                $other === $reservation
                || \in_array(self::statusKey($other->getStatut()), ['refused', 'closed'], true)
                || $other->getSalle()?->getId() !== $reservation->getSalle()?->getId()
                || $other->getDateDebut() >= $reservation->getDateFin()
                || $other->getDateFin() <= $reservation->getDateDebut()
            ) {
                continue;
            }
            $ids[] = (int) $other->getId();
        }

        return $ids;
    }
}
