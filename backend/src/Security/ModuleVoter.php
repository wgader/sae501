<?php

declare(strict_types=1);

namespace App\Security;

use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\AccessDecisionManagerInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Vote;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/**
 * Accès à un module (salles, matériel…) : les agents qui le gèrent, l'administrateur, et les
 * associations pour lesquelles la mairie l'a activé.
 *
 * Usage : #[IsGranted(ModuleVoter::ROOMS)]
 *
 * @extends Voter<string, mixed>
 */
final class ModuleVoter extends Voter
{
    public const ROOMS = 'MODULE_ROOMS';
    public const EQUIPMENT = 'MODULE_EQUIPMENT';
    public const GRANTS = 'MODULE_GRANTS';
    public const EVENTS = 'MODULE_EVENTS';

    /** Rôle des agents du module ; ROLE_ADMIN en hérite (role_hierarchy). */
    private const STAFF_ROLES = [
        self::ROOMS => 'ROLE_GESTION_SALLE',
        self::EQUIPMENT => 'ROLE_GESTION_MATERIEL',
        self::GRANTS => 'ROLE_GESTION_SUBVENTION',
        self::EVENTS => 'ROLE_GESTION_EVENT',
    ];

    public function __construct(private readonly AccessDecisionManagerInterface $accessDecisionManager)
    {
    }

    protected function supports(string $attribute, mixed $subject): bool
    {
        return isset(self::STAFF_ROLES[$attribute]);
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token, ?Vote $vote = null): bool
    {
        if ($this->accessDecisionManager->decide($token, [self::STAFF_ROLES[$attribute]])) {
            return true;
        }

        $user = $token->getUser();
        $association = $user instanceof User ? $user->getAssociation() : null;
        if (null === $association || !in_array('ROLE_ASSOCIATION', $token->getRoleNames(), true)) {
            return false;
        }

        return match ($attribute) {
            self::ROOMS => $association->isModuleSalleActif(),
            self::EQUIPMENT => $association->isModuleMaterielActif(),
            self::GRANTS => $association->isModuleSubventionActif(),
            self::EVENTS => $association->isModuleEvenementActif(),
            default => false,
        };
    }
}
