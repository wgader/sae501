<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\User;
use App\Security\SessionCookie;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Profil de la session ouverte : le frontend ne lit plus le JWT, il demande qui est connecté.
 */
final class SessionController extends AbstractController
{
    #[Route('/api/auth/session', name: 'api_auth_session', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function __invoke(#[CurrentUser] User $user): JsonResponse
    {
        return $this->json(['user' => SessionCookie::profile($user)]);
    }
}
