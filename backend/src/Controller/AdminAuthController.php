<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Security\SecurityAuditLogger;
use App\Security\SessionCookie;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Authentification dédiée aux administrateurs (agents de la mairie).
 *
 * Différence clé avec /api/auth/login :
 *   - Le JWT n'est jamais émis si le compte n'a pas un rôle mairie autorisé
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
     *   200 → { "user": {…} } et cookie de session HttpOnly
     *   400 → champs manquants
     *   401 → identifiants incorrects
     *   403 → compte valide mais sans rôle mairie autorisé
     */
    #[Route('/admin/login', name: 'api_admin_login', methods: ['POST'])]
    public function adminLogin(
        Request $request,
        UserRepository $userRepository,
        UserPasswordHasherInterface $passwordHasher,
        SessionCookie $sessionCookie,
        #[Autowire(service: 'limiter.admin_login_account')]
        RateLimiterFactory $accountLimiter,
        #[Autowire(service: 'limiter.admin_login_ip')]
        RateLimiterFactory $ipLimiter,
        SecurityAuditLogger $audit,
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

        // ── Limitation des tentatives (par compte + IP, et par IP) ────────────
        $clientIp = (string) $request->getClientIp();
        $accountLimit = $accountLimiter->create(mb_strtolower($email).'|'.$clientIp);
        $ipLimit = $ipLimiter->create($clientIp);
        // consume(0) lit l’état sans rien décompter : bloqué dès qu’il ne reste plus d’essai.
        if ($accountLimit->consume(0)->getRemainingTokens() <= 0 || $ipLimit->consume(0)->getRemainingTokens() <= 0) {
            $audit->loginFailed($email, 'mairie', 'throttled');

            return $this->json(
                ['message' => 'Trop de tentatives de connexion. Réessayez dans 15 minutes.'],
                Response::HTTP_TOO_MANY_REQUESTS,
                ['Retry-After' => '900'],
            );
        }

        // ── Vérification des identifiants ─────────────────────────────────────
        // Message identique si user inexistant ou mauvais mot de passe
        // → évite l'énumération d'emails (user enumeration attack)
        $user = $userRepository->findOneBy(['email' => $email]);

        if ($user === null || !$passwordHasher->isPasswordValid($user, $password)) {
            // Seuls les échecs sont comptés.
            $accountLimit->consume();
            $ipLimit->consume();
            $audit->loginFailed($email, 'mairie', 'invalid_credentials');

            return $this->json(
                ['message' => 'Identifiants incorrects.'],
                Response::HTTP_UNAUTHORIZED
            );
        }

        // ── Vérification des rôles mairie côté serveur ────────────────────────
        if (
            $user->isDeleted()
            || !$user->isVerified()
            || $user->getInactivatedAt() !== null
            || array_intersect(User::ROLES_MAIRIE, $user->getRoles()) === []
        ) {
            $audit->loginFailed($email, 'mairie', 'not_allowed');

            return $this->json(
                ['message' => 'Accès refusé — un rôle mairie est requis.'],
                Response::HTTP_FORBIDDEN
            );
        }

        $accountLimit->reset();
        $audit->loginSucceeded($user, 'mairie');

        // ── Session : JWT dans un cookie HttpOnly, profil dans le corps ──────
        return $sessionCookie->open($this->json(['user' => SessionCookie::profile($user)]), $user);
    }
}