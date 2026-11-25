<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\Association;
use App\Entity\Campaign;
use App\Entity\ReservationSalle;
use App\Entity\Salle;
use App\Entity\User;
use App\Exception\RoomReservationConflictException;
use App\Service\AssociationRequestCancellationService;
use App\Service\CampaignPlanningExporter;
use App\Service\CampaignRequestService;
use App\Service\CampaignService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\ExpressionLanguage\Expression;
use Symfony\Component\HttpFoundation\HeaderUtils;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\String\Slugger\AsciiSlugger;

/**
 * Gestion par la mairie des demandes de salle d’une campagne annuelle et de ses dates.
 */
#[Route('/api/admin/campaigns/{id<\d+>}')]
#[IsGranted(new Expression("is_granted('ROLE_ADMIN') or is_granted('ROLE_GESTION_SALLE')"))]
final class CampaignRequestController extends AbstractController
{
    public function __construct(
        private readonly CampaignRequestService $requestService,
        private readonly CampaignService $campaignService,
        private readonly EntityManagerInterface $entityManager,
        private readonly CampaignPlanningExporter $planningExporter,
        private readonly AssociationRequestCancellationService $cancellationService,
    ) {
    }

    /**
     * Planning PDF des demandes : ?view=complet|general|salle|association, ?from=&to= (AAAA-MM-JJ)
     * pour une période, ?refused=1 pour inclure les demandes refusées.
     */
    #[Route('/planning.pdf', name: 'admin_campaign_planning_pdf', methods: ['GET'])]
    public function planning(Campaign $campaign, Request $request): Response
    {
        $view = $request->query->getString('view', CampaignPlanningExporter::VIEW_FULL);

        try {
            $pdf = $this->planningExporter->export(
                $campaign,
                $this->dayParameter($request, 'from'),
                $this->dayParameter($request, 'to'),
                $view,
                $request->query->getBoolean('refused'),
            );
        } catch (\InvalidArgumentException $exception) {
            return $this->json(['message' => $exception->getMessage()], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $filename = \sprintf('planning-salles-%s-%s.pdf', (new AsciiSlugger('fr'))->slug((string) $campaign->getSeasonLabel())->lower(), $view);

        return new Response($pdf, Response::HTTP_OK, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => HeaderUtils::makeDisposition(HeaderUtils::DISPOSITION_ATTACHMENT, $filename),
            'Cache-Control' => 'private, no-store',
        ]);
    }

    #[Route('/schedule', name: 'admin_campaign_schedule', methods: ['PATCH'])]
    public function schedule(Campaign $campaign, Request $request): JsonResponse
    {
        $payload = $this->payload($request);

        return $this->handle(fn (): array => CampaignController::serializeCampaign($this->campaignService->reschedule(
            $campaign,
            $this->dateField($payload, 'openingAt'),
            $this->dateField($payload, 'closingAt'),
            $this->optionalDay($payload, 'periodStart'),
            $this->optionalDay($payload, 'periodEnd'),
        )));
    }

    #[Route('/requests', name: 'admin_campaign_requests', methods: ['GET'])]
    public function list(Campaign $campaign): JsonResponse
    {
        $requests = $this->requestService->listRequests($campaign);

        return $this->json([
            'campaign' => CampaignController::serializeCampaign($campaign),
            'requests' => array_map(
                static fn (ReservationSalle $reservation): array => CampaignRequestService::serialize($reservation, $requests),
                $requests,
            ),
        ]);
    }

    #[Route('/requests', name: 'admin_campaign_request_add', methods: ['POST'])]
    public function add(Campaign $campaign, Request $request): JsonResponse
    {
        $payload = $this->payload($request);

        // Les demandes voisines accompagnent la réponse : un chevauchement est signalé tout de suite.
        return $this->handle(fn (): array => $this->withSiblings($campaign, $this->requestService->addSlot(
            $campaign,
            $this->agent(),
            $this->findOr404(Association::class, $payload['associationId'] ?? null, 'Association introuvable.'),
            $this->findOr404(Salle::class, $payload['salleId'] ?? null, 'Salle introuvable.'),
            $this->slotField($payload, 'dateDebut'),
            $this->slotField($payload, 'dateFin'),
            \is_string($payload['motifEvenement'] ?? null) ? $payload['motifEvenement'] : '',
        )), Response::HTTP_CREATED);
    }

    /**
     * @return array<string, mixed>
     */
    private function withSiblings(Campaign $campaign, ReservationSalle $reservation): array
    {
        return CampaignRequestService::serialize($reservation, $this->requestService->listRequests($campaign));
    }

    #[Route('/requests/{requestId<\d+>}/accept', name: 'admin_campaign_request_accept', methods: ['POST'])]
    public function accept(Campaign $campaign, int $requestId): JsonResponse
    {
        $reservation = $this->findRequest($campaign, $requestId);

        return $this->handle(fn (): array => CampaignRequestService::serialize($this->requestService->accept($reservation, $this->agent())));
    }

    #[Route('/requests/{requestId<\d+>}/refuse', name: 'admin_campaign_request_refuse', methods: ['POST'])]
    public function refuse(Campaign $campaign, int $requestId, Request $request): JsonResponse
    {
        $reservation = $this->findRequest($campaign, $requestId);
        $reason = $this->payload($request)['reason'] ?? null;

        return $this->handle(fn (): array => CampaignRequestService::serialize(
            $this->requestService->refuse($reservation, $this->agent(), \is_string($reason) ? $reason : null),
        ));
    }

    #[Route('/requests/{requestId<\d+>}/notify-conflict', name: 'admin_campaign_request_notify_conflict', methods: ['POST'])]
    public function notifyConflict(Campaign $campaign, int $requestId): JsonResponse
    {
        $reservation = $this->findRequest($campaign, $requestId);

        return $this->handle(fn (): array => [
            'notified' => \count($this->requestService->notifyConflict($reservation, $this->agent())),
        ]);
    }

    #[Route('/requests/{requestId<\d+>}/cancel', name: 'admin_campaign_request_cancel', methods: ['POST'])]
    public function cancel(Campaign $campaign, int $requestId, Request $request): JsonResponse
    {
        $reservation = $this->findRequest($campaign, $requestId);
        $reason = $this->payload($request)['reason'] ?? null;

        return $this->handle(fn (): array => CampaignRequestService::serialize(
            $this->cancellationService->cancelByTownHall($reservation, $this->agent(), \is_string($reason) ? $reason : null),
        ));
    }

    #[Route('/requests/{requestId<\d+>}', name: 'admin_campaign_request_reschedule', methods: ['PATCH'])]
    public function reschedule(Campaign $campaign, int $requestId, Request $request): JsonResponse
    {
        $reservation = $this->findRequest($campaign, $requestId);
        $payload = $this->payload($request);
        $reason = $payload['reason'] ?? null;

        return $this->handle(fn (): array => CampaignRequestService::serialize($this->requestService->reschedule(
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
     * @param array<string, mixed> $payload
     */
    private function optionalDay(array $payload, string $field): ?\DateTimeImmutable
    {
        $value = $payload[$field] ?? null;
        if (null === $value || '' === $value) {
            return null;
        }
        $day = \is_string($value) ? \DateTimeImmutable::createFromFormat('!Y-m-d', $value) : false;
        if (false === $day || $day->format('Y-m-d') !== $value) {
            throw new \InvalidArgumentException(\sprintf('Le champ « %s » doit être une date au format AAAA-MM-JJ.', $field));
        }

        return $day;
    }

    private function dayParameter(Request $request, string $name): ?\DateTimeImmutable
    {
        $value = $request->query->getString($name);
        if ('' === $value) {
            return null;
        }

        $day = \DateTimeImmutable::createFromFormat('!Y-m-d', $value);
        if (false === $day || $day->format('Y-m-d') !== $value) {
            throw new \InvalidArgumentException(\sprintf('Le paramètre « %s » doit être une date au format AAAA-MM-JJ.', $name));
        }

        return $day;
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
}
