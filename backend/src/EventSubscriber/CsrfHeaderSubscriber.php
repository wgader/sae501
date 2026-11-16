<?php

declare(strict_types=1);

namespace App\EventSubscriber;

use App\Security\SessionCookie;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * Protection CSRF des appels authentifiés par cookie : une requête qui modifie des données doit
 * porter l’en-tête X-Requested-With. Un autre site ne peut pas l’ajouter sans l’autorisation CORS
 * de l’API, alors qu’un formulaire piégé enverrait le cookie automatiquement.
 * Les appels authentifiés par l’en-tête Authorization (outils, tests) ne sont pas concernés.
 */
final class CsrfHeaderSubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        // Avant le pare-feu (priorité 8) : la requête est refusée avant toute authentification.
        return [KernelEvents::REQUEST => ['onRequest', 16]];
    }

    public function onRequest(RequestEvent $event): void
    {
        $request = $event->getRequest();
        if (
            !$event->isMainRequest()
            || $request->isMethodSafe()
            || !str_starts_with($request->getPathInfo(), '/api/')
            || !$request->cookies->has(SessionCookie::NAME)
            || $request->headers->has('Authorization')
            || 'XMLHttpRequest' === $request->headers->get('X-Requested-With')
        ) {
            return;
        }

        $event->setResponse(new JsonResponse(
            ['message' => 'Requête refusée : en-tête de sécurité manquant.'],
            Response::HTTP_FORBIDDEN,
        ));
    }
}
