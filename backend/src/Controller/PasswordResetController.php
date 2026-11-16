<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Security\PasswordPolicy;
use App\Security\SecurityAuditLogger;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Mot de passe oublié, pour les associations comme pour les agents de la mairie.
 *
 *   POST /api/auth/password-reset/request  { email }            → toujours 200 (anti-énumération)
 *   POST /api/auth/password-reset/confirm  { token, password }  → 200, 401 lien invalide, 422 mot de passe refusé
 */
#[Route('/api/auth/password-reset')]
final class PasswordResetController extends AbstractController
{
    private const TOKEN_LIFETIME = '+1 hour';

    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly EntityManagerInterface $entityManager,
        private readonly MailerInterface $mailer,
        private readonly LoggerInterface $logger,
        private readonly SecurityAuditLogger $audit,
        #[Autowire(service: 'limiter.password_reset')]
        private readonly RateLimiterFactory $limiter,
        #[Autowire(env: 'MAILER_FROM')] private readonly string $mailerFrom,
        #[Autowire(env: 'FRONTEND_URL')] private readonly string $frontendUrl,
    ) {
    }

    #[Route('/request', name: 'api_password_reset_request', methods: ['POST'])]
    public function requestReset(Request $request): JsonResponse
    {
        if (null !== $tooMany = $this->throttle($request)) {
            return $tooMany;
        }

        $genericResponse = $this->json([
            'message' => 'Si un compte actif correspond à cette adresse, un lien de réinitialisation vient de lui être envoyé.',
        ]);

        $email = $this->payload($request)['email'] ?? null;
        if (!\is_string($email) || '' === trim($email)) {
            return $genericResponse;
        }

        $user = $this->userRepository->findOneBy(['email' => trim($email)]);
        $this->audit->passwordResetRequested($user, $email);
        if (!$this->canReset($user)) {
            return $genericResponse;
        }

        $token = bin2hex(random_bytes(32));
        $user->startPasswordReset(hash('sha256', $token), new \DateTimeImmutable(self::TOKEN_LIFETIME));
        $this->entityManager->flush();

        try {
            $this->mailer->send(
                (new TemplatedEmail())
                    ->from(new Address($this->mailerFrom, 'Mairie de Feytiat'))
                    ->to((string) $user->getEmail())
                    ->subject('Réinitialisation de votre mot de passe — Mairie de Feytiat')
                    ->htmlTemplate('emails/password_reset.html.twig')
                    ->context([
                        'prenom' => $user->getPrenom(),
                        'resetUrl' => rtrim($this->frontendUrl, '/').'/reinitialiser-mot-de-passe?token='.$token,
                    ]),
            );
        } catch (\Throwable $exception) {
            // La réponse reste identique : elle ne doit pas révéler l’existence du compte.
            $this->logger->error('password_reset: e-mail non envoyé', ['exception' => $exception->getMessage()]);
        }

        return $genericResponse;
    }

    #[Route('/confirm', name: 'api_password_reset_confirm', methods: ['POST'])]
    public function confirm(
        Request $request,
        PasswordPolicy $passwordPolicy,
        UserPasswordHasherInterface $passwordHasher,
    ): JsonResponse {
        if (null !== $tooMany = $this->throttle($request)) {
            return $tooMany;
        }

        $payload = $this->payload($request);
        $token = $payload['token'] ?? null;
        $password = $payload['password'] ?? null;
        if (!\is_string($token) || !\is_string($password) || '' === $token || '' === $password) {
            return $this->json(['message' => 'Les champs « token » et « password » sont requis.'], Response::HTTP_BAD_REQUEST);
        }

        $user = $this->userRepository->findOneBy(['passwordResetTokenHash' => hash('sha256', $token)]);
        $expiresAt = $user?->getPasswordResetExpiresAt();
        if (!$this->canReset($user) || null === $expiresAt || $expiresAt < new \DateTimeImmutable()) {
            return $this->json(['message' => 'Ce lien de réinitialisation est invalide ou a expiré.'], Response::HTTP_UNAUTHORIZED);
        }

        $errors = $passwordPolicy->violations($password);
        if ([] !== $errors) {
            return $this->json(['errors' => $errors], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Le lien ne sert qu’une fois et toutes les sessions ouvertes avec l’ancien mot de passe tombent.
        $user->setPassword($passwordHasher->hashPassword($user, $password))
            ->clearPasswordReset()
            ->setCredentialsChangedAt(new \DateTimeImmutable());
        $this->entityManager->flush();
        $this->audit->passwordChanged($user, 'reset');

        return $this->json([
            'message' => 'Votre mot de passe a été modifié. Vous pouvez vous connecter.',
            'loginPath' => 'mairie' === $user->getTypeCompte() ? '/admin' : '/connexion',
        ]);
    }

    /**
     * @phpstan-assert-if-true User $user
     */
    private function canReset(?User $user): bool
    {
        return null !== $user
            && $user->isVerified()
            && !$user->isDeleted()
            && null === $user->getInactivatedAt();
    }

    private function throttle(Request $request): ?JsonResponse
    {
        $limit = $this->limiter->create($request->getClientIp() ?? 'unknown')->consume();
        if ($limit->isAccepted()) {
            return null;
        }

        return $this->json(
            ['message' => 'Trop de demandes. Réessayez dans quelques minutes.'],
            Response::HTTP_TOO_MANY_REQUESTS,
            ['Retry-After' => (string) max(1, $limit->getRetryAfter()->getTimestamp() - time())],
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(Request $request): array
    {
        $data = json_decode($request->getContent(), true);

        return \is_array($data) ? $data : [];
    }
}
