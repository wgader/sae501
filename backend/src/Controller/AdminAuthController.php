<?php

namespace App\Controller;

use App\Repository\UserRepository;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Authentification dédiée aux administrateurs (agents de la mairie).
 *
 * Différence clé avec /api/auth/login :
 *   - Le JWT n'est jamais émis si le compte n'a pas ROLE_ADMIN
 *   - Le check de rôle est entièrement côté serveur
 */
#[Route('/api/auth')]
final class AdminAuthController extends AbstractController
{
    /**
     * Connexion administrateur.
     *
     * Payload JSON :
     * { "email": "admin@mairie.fr", "password": "monMotDePasse" }
     *
     * Réponses :
     *   200 → { "token": "<JWT>" }
     *   400 → champs manquants
     *   401 → identifiants incorrects
     *   403 → compte valide mais pas ROLE_ADMIN
     */
    #[Route('/admin/login', name: 'api_admin_login', methods: ['POST'])]
    public function adminLogin(
        Request $request,
        UserRepository $userRepository,
        UserPasswordHasherInterface $passwordHasher,
        JWTTokenManagerInterface $jwtManager,
    ): JsonResponse {
        $data     = json_decode($request->getContent(), true);
        $email    = trim((string) ($data['email'] ?? ''));
        $password = (string) ($data['password'] ?? '');

        // ── Champs obligatoires ───────────────────────────────────────────────
        if ($email === '' || $password === '') {
            return $this->json(
                ['message' => 'Identifiant et mot de passe requis.'],
                Response::HTTP_BAD_REQUEST
            );
        }

        // ── Vérification des identifiants ─────────────────────────────────────
        // Message identique si user inexistant ou mauvais mot de passe
        // → évite l'énumération d'emails (user enumeration attack)
        $user = $userRepository->findOneBy(['email' => $email]);

        if ($user === null || !$passwordHasher->isPasswordValid($user, $password)) {
            return $this->json(
                ['message' => 'Identifiants incorrects.'],
                Response::HTTP_UNAUTHORIZED
            );
        }

        // ── Vérification du rôle ADMIN côté serveur ───────────────────────────
        // Le JWT n'est jamais généré si le compte n'est pas admin
        if (!in_array('ROLE_ADMIN', $user->getRoles(), true)) {
            return $this->json(
                ['message' => 'Accès refusé — droits administrateur requis.'],
                Response::HTTP_FORBIDDEN
            );
        }

        // ── Génération du JWT ─────────────────────────────────────────────────
        return $this->json(['token' => $jwtManager->create($user)]);
    }
}