<?php

declare(strict_types=1);

namespace App\EventSubscriber;

use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\RateLimiter\RateLimiterFactory;

/**
 * Limite le nombre de fichiers déposés par compte, sur tous les points d’envoi de l’API : chaque
 * fichier est limité en taille, mais sans plafond de nombre un compte pourrait remplir le disque.
 */
final class UploadThrottleSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private readonly Security $security,
        #[Autowire(service: 'limiter.file_upload')]
        private readonly RateLimiterFactory $limiter,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        // Après le pare-feu (priorité 8) pour connaître le compte, avant le contrôleur.
        return [KernelEvents::REQUEST => ['onRequest', 7]];
    }

    public function onRequest(RequestEvent $event): void
    {
        $request = $event->getRequest();
        if (
            !$event->isMainRequest()
            || $request->isMethodSafe()
            || 0 === $request->files->count()
            || !str_starts_with($request->getPathInfo(), '/api/')
        ) {
            return;
        }

        // Une requête anonyme sera refusée par le contrôle d’accès : rien à compter.
        $user = $this->security->getUser();
        if (null === $user) {
            return;
        }

        $limit = $this->limiter->create($user->getUserIdentifier())->consume();
        if ($limit->isAccepted()) {
            return;
        }

        $event->setResponse(new JsonResponse(
            ['message' => 'Trop de fichiers envoyés. Réessayez dans un moment.'],
            Response::HTTP_TOO_MANY_REQUESTS,
            ['Retry-After' => (string) max(1, $limit->getRetryAfter()->getTimestamp() - time())],
        ));
    }
}
