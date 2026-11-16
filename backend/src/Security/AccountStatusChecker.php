<?php

declare(strict_types=1);

namespace App\Security;

use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAccountStatusException;
use Symfony\Component\Security\Core\User\UserCheckerInterface;
use Symfony\Component\Security\Core\User\UserInterface;

/**
 * Refuse les comptes non activés, suspendus ou supprimés, à la connexion comme à chaque appel
 * authentifié : une suspension prend effet immédiatement, sans attendre l’expiration du JWT.
 * Le contrôle a lieu après la vérification du mot de passe, pour ne rien révéler à un tiers.
 */
final class AccountStatusChecker implements UserCheckerInterface
{
    public function checkPreAuth(UserInterface $user): void
    {
    }

    public function checkPostAuth(UserInterface $user, ?TokenInterface $token = null): void
    {
        if (!$user instanceof User) {
            return;
        }

        if ($user->isDeleted()) {
            throw new CustomUserMessageAccountStatusException('Identifiants incorrects.');
        }
        if (!$user->isVerified()) {
            throw new CustomUserMessageAccountStatusException('Votre compte n’est pas encore activé.');
        }
        if (null !== $user->getInactivatedAt()) {
            throw new CustomUserMessageAccountStatusException('Votre compte a été suspendu. Contactez la mairie.');
        }
    }
}
