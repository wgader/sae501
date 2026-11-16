<?php

declare(strict_types=1);

namespace App\EventSubscriber;

use App\Entity\User;
use App\Security\SecurityAuditLogger;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\Security\Core\Exception\TooManyLoginAttemptsAuthenticationException;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Symfony\Component\Security\Http\Event\LoginFailureEvent;
use Symfony\Component\Security\Http\Event\LoginSuccessEvent;
use Symfony\Component\Security\Http\Event\LogoutEvent;

/**
 * Journalise la connexion des associations (pare-feu « login ») et les déconnexions.
 * La connexion de la mairie, gérée par AdminAuthController, journalise elle-même.
 */
final class SecurityAuditSubscriber implements EventSubscriberInterface
{
    public function __construct(private readonly SecurityAuditLogger $audit)
    {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            LoginSuccessEvent::class => 'onLoginSuccess',
            LoginFailureEvent::class => 'onLoginFailure',
            LogoutEvent::class => 'onLogout',
        ];
    }

    public function onLoginSuccess(LoginSuccessEvent $event): void
    {
        $user = $event->getUser();
        // Le pare-feu API ré-authentifie chaque requête par JWT : seule la connexion par mot de passe compte.
        if ('login' === $event->getFirewallName() && $user instanceof User) {
            $this->audit->loginSucceeded($user, 'association');
        }
    }

    public function onLoginFailure(LoginFailureEvent $event): void
    {
        if ('login' !== $event->getFirewallName()) {
            return;
        }

        $identifier = $event->getPassport()?->getBadge(UserBadge::class)?->getUserIdentifier()
            ?? (string) $event->getRequest()->getPayload()->get('email', '');
        $reason = $event->getException() instanceof TooManyLoginAttemptsAuthenticationException ? 'throttled' : 'invalid_credentials';
        $this->audit->loginFailed($identifier, 'association', $reason);
    }

    public function onLogout(LogoutEvent $event): void
    {
        $user = $event->getToken()?->getUser();
        if ($user instanceof User) {
            $this->audit->logout($user);
        }
    }
}
