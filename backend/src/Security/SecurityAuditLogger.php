<?php

declare(strict_types=1);

namespace App\Security;

use App\Entity\User;
use Monolog\Attribute\WithMonologChannel;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\RequestStack;

/**
 * Journal de sécurité (canal « audit ») : connexions, échecs, déconnexions, mots de passe et
 * rôles. Aucun secret n’y figure ; une adresse e-mail saisie n’y apparaît que sous forme
 * d’empreinte HMAC, suffisante pour repérer des tentatives répétées sur un même compte.
 */
#[WithMonologChannel('audit')]
final class SecurityAuditLogger
{
    public function __construct(
        private readonly LoggerInterface $logger,
        private readonly RequestStack $requestStack,
        #[Autowire('%kernel.secret%')] private readonly string $secret,
    ) {
    }

    public function loginSucceeded(User $user, string $portal): void
    {
        $this->logger->info('login.success', $this->context(['user' => $user->getId(), 'portal' => $portal]));
    }

    public function loginFailed(string $identifier, string $portal, string $reason): void
    {
        $this->logger->warning('login.failure', $this->context([
            'account' => $this->fingerprint($identifier),
            'portal' => $portal,
            'reason' => $reason,
        ]));
    }

    public function logout(User $user): void
    {
        $this->logger->info('logout', $this->context(['user' => $user->getId()]));
    }

    public function passwordResetRequested(?User $user, string $identifier): void
    {
        $this->logger->info('password.reset_requested', $this->context([
            'account' => $this->fingerprint($identifier),
            'user' => $user?->getId(),
        ]));
    }

    public function passwordChanged(User $user, string $reason): void
    {
        $this->logger->notice('password.changed', $this->context(['user' => $user->getId(), 'reason' => $reason]));
    }

    /**
     * @param list<string> $before
     * @param list<string> $after
     */
    public function rolesChanged(User $target, ?User $actor, array $before, array $after): void
    {
        $this->logger->notice('roles.changed', $this->context([
            'user' => $target->getId(),
            'by' => $actor?->getId(),
            'added' => array_values(array_diff($after, $before)),
            'removed' => array_values(array_diff($before, $after)),
        ]));
    }

    /**
     * @param array<string, mixed> $context
     *
     * @return array<string, mixed>
     */
    private function context(array $context): array
    {
        return $context + ['ip' => $this->requestStack->getCurrentRequest()?->getClientIp()];
    }

    private function fingerprint(string $identifier): string
    {
        return substr(hash_hmac('sha256', mb_strtolower(trim($identifier)), $this->secret), 0, 16);
    }
}
