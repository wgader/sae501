<?php

namespace App\Controller;

use Symfony\Component\EventDispatcher\EventDispatcherInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Event\LogoutEvent;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;

#[Route('/api/auth')]
final class LogoutController
{
    #[Route('/logout', name: 'api_logout', methods: ['POST'])]
    public function __invoke(
        Request $request,
        EventDispatcherInterface $eventDispatcher,
        TokenStorageInterface $tokenStorage,
    ): JsonResponse {
        $eventDispatcher->dispatch(new LogoutEvent($request, $tokenStorage->getToken()));

        return new JsonResponse(['message' => 'Déconnexion réussie.'], Response::HTTP_OK);
    }
}
