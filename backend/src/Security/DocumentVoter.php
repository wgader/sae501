<?php

declare(strict_types=1);

namespace App\Security;

use App\Entity\DocumentJustificatif;
use App\Entity\User;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Vote;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/**
 * Téléchargement d’une pièce justificative :
 * - l’association propriétaire ;
 * - l’administrateur ;
 * - un agent de la mairie seulement pour les pièces de son module (salles, matériel, subventions,
 *   événements) et pour les pièces générales du dossier de l’association.
 *
 * @extends Voter<string, DocumentJustificatif>
 */
final class DocumentVoter extends Voter
{
    public const DOWNLOAD = 'DOCUMENT_DOWNLOAD';

    /** Rôle de gestion requis selon le type de démarche auquel la pièce est rattachée. */
    private const MODULE_ROLES = [
        'salle' => ['ROLE_GESTION_SALLE'],
        'materiel' => ['ROLE_GESTION_MATERIEL'],
        'subvention' => ['ROLE_GESTION_SUBVENTION'],
        'evenement' => ['ROLE_GESTION_EVENT', 'ROLE_ADMIN_GESTION_EVENT'],
    ];

    public function __construct(private readonly Security $security)
    {
    }

    protected function supports(string $attribute, mixed $subject): bool
    {
        return self::DOWNLOAD === $attribute && $subject instanceof DocumentJustificatif;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token, ?Vote $vote = null): bool
    {
        $user = $token->getUser();
        if (!$user instanceof User || null !== $subject->getDeletedAt()) {
            return false;
        }

        $ownerId = $subject->getAssociation()?->getId();
        if (null !== $ownerId && $ownerId === $user->getAssociation()?->getId()) {
            return true;
        }

        if ($this->security->isGranted('ROLE_ADMIN')) {
            return true;
        }

        if ([] === array_intersect(User::ROLES_MAIRIE, $user->getRoles())) {
            return false;
        }

        $type = $subject->getLieAType();
        if (null === $type || '' === $type) {
            // Pièces générales (statuts, attestations) : utiles à tout agent qui instruit un dossier.
            return true;
        }

        foreach (self::MODULE_ROLES[$type] ?? [] as $role) {
            if ($this->security->isGranted($role)) {
                return true;
            }
        }

        return false;
    }
}
