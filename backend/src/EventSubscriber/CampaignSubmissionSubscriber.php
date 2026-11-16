<?php

declare(strict_types=1);

namespace App\EventSubscriber;

use App\Repository\CampaignRepository;
use App\Service\CampaignService;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

final class CampaignSubmissionSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private readonly CampaignRepository $repository,
        private readonly CampaignService $campaignService,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::REQUEST => ['onRequest', 10],
        ];
    }

    public function onRequest(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        if ('POST' !== $request->getMethod() || '/api/reservation_salles' !== $request->getPathInfo()) {
            return;
        }

        $this->campaignService->synchronize(new \DateTimeImmutable());
        if (null !== $this->repository->findCurrent(new \DateTimeImmutable(), 'salle')) {
            return;
        }

        $event->setResponse(new JsonResponse([
            'message' => 'Le dépôt des vœux annuels est fermé : aucune campagne active.',
        ], JsonResponse::HTTP_FORBIDDEN));
    }
}
