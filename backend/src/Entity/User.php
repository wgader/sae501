<?php

namespace App\Entity;

use App\Repository\UserRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Représente un utilisateur de la plateforme.
 *
 * Types de compte :
 *   - 'association' → représentant d'une association
 *   - 'mairie'      → agent ou admin de la mairie
 *
 * Rôles disponibles :
 *   - ROLE_ASSOCIATION         → accès espace association
 *   - ROLE_ADMIN               → accès total (admin mairie)
 *   - ROLE_ADMIN_GESTION_EVENT → gestion des événements externes
 *   - ROLE_GESTION_SUBVENTION  → accès module subventions
 *   - ROLE_GESTION_MATERIEL    → accès module matériel
 *   - ROLE_GESTION_SALLE       → accès module salles
 *
 * Un agent mairie peut cumuler plusieurs rôles.
 * Le mot de passe est null jusqu'à l'activation du compte via le lien envoyé par la mairie.
 */
#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: '`user`')]
#[ORM\UniqueConstraint(name: 'UNIQ_IDENTIFIER_EMAIL', fields: ['email'])]
#[UniqueEntity(
    fields: ['email'],
    message: 'Un compte existe déjà avec cette adresse email.'
)]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    /**
     * Rôles valides dans l'application.
     * Utilisé pour valider les rôles assignés par l'admin.
     */
    public const ROLES_MAIRIE = [
        'ROLE_ADMIN',
        'ROLE_GESTION_EVENT',
        'ROLE_GESTION_SUBVENTION',
        'ROLE_GESTION_MATERIEL',
        'ROLE_GESTION_SALLE',
    ];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 180)]
    #[Assert\NotBlank(message: "L'email est obligatoire.")]
    #[Assert\Email(message: "Format email invalide.")]
    #[Assert\Length(max: 180, maxMessage: "L'email ne peut pas dépasser {{ limit }} caractères.")]
    private ?string $email = null;

    /**
     * Tableau de rôles Symfony.
     * ROLE_USER est toujours ajouté automatiquement par getRoles().
     *
     * @var list<string>
     */
    #[ORM\Column]
    private array $roles = [];

    /**
     * Mot de passe haché (Argon2id via Symfony).
     * Null jusqu'à l'activation du compte par le lien envoyé par la mairie.
     */
    #[ORM\Column(nullable: true)]
    private ?string $password = null;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank(message: "Le nom est obligatoire.")]
    #[Assert\Length(max: 100, maxMessage: "Le nom ne peut pas dépasser {{ limit }} caractères.")]
    private ?string $nom = null;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank(message: "Le prénom est obligatoire.")]
    #[Assert\Length(max: 100, maxMessage: "Le prénom ne peut pas dépasser {{ limit }} caractères.")]
    private ?string $prenom = null;

    /**
     * Téléphone optionnel à l'inscription.
     */
    #[ORM\Column(length: 20, nullable: true)]
    #[Assert\Regex(
        pattern: '/^(\+33|0)[1-9](\d{2}){4}$/',
        message: "Format de téléphone invalide. Exemple : 0612345678"
    )]
    private ?string $telephone = null;

    /**
     * 'association' ou 'mairie'.
     * Détermine l'espace auquel l'utilisateur a accès.
     */
    #[ORM\Column(length: 20)]
    #[Assert\NotBlank]
    #[Assert\Choice(
        choices: ['association', 'mairie'],
        message: "Type de compte invalide."
    )]
    private ?string $typeCompte = null;

    /**
     * false → compte créé mais pas encore activé (lien d'activation non cliqué)
     * true  → compte actif, connexion possible
     */
    #[ORM\Column]
    private bool $isVerified = false;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    /**
     * Date d'acceptation des CGU — tracé pour conformité RGPD.
     */
    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $cguValidateAt = null;

    /**
     * Token d'activation envoyé par email après validation de la mairie.
     * Permet à l'association de définir son mot de passe.
     * Nettoyé après activation.
     */
    #[ORM\Column(length: 100, nullable: true)]
    private ?string $activationToken = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $activationTokenExpiresAt = null;

    /**
     * Rempli si le compte est suspendu temporairement par l'admin.
     * Null = compte actif.
     */
    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $inactivatedAt = null;

    /**
     * Soft delete — le compte n'est jamais physiquement supprimé.
     * Permet de garder un historique des actions de l'utilisateur.
     */
    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $deletedAt = null;

    /**
     * Null pour les agents mairie (typeCompte = 'mairie').
     * Renseigné pour les représentants d'association.
     */
    #[ORM\ManyToOne(inversedBy: 'users')]
    private ?Association $association = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->roles     = ['ROLE_USER'];
        $this->isVerified = false;
    }

    // ── Getters / Setters ────────────────────────────────────────────────────

    public function getId(): ?int { return $this->id; }

    public function getEmail(): ?string { return $this->email; }
    public function setEmail(string $email): static { $this->email = $email; return $this; }

    /**
     * Identifiant unique utilisé par Symfony Security (= email).
     */
    public function getUserIdentifier(): string { return (string) $this->email; }

    /**
     * Retourne les rôles de l'utilisateur.
     * ROLE_USER est toujours présent — c'est la base de la hiérarchie Symfony.
     *
     * @return list<string>
     */
    public function getRoles(): array
    {
        $roles = $this->roles;
        $roles[] = 'ROLE_USER';
        return array_unique($roles);
    }

    /** @param list<string> $roles */
    public function setRoles(array $roles): static { $this->roles = $roles; return $this; }

    /**
     * Mot de passe haché. Null avant activation du compte.
     */
    public function getPassword(): ?string { return $this->password; }
    public function setPassword(?string $password): static { $this->password = $password; return $this; }

    /**
     * Évite que le hash du mot de passe ne soit stocké en clair en session.
     * Gère le cas où password est null (avant activation).
     */
    public function __serialize(): array
    {
        $data = (array) $this;
        $data["\0" . self::class . "\0password"] = $this->password !== null
            ? hash('crc32c', $this->password)
            : null;
        return $data;
    }

    /**
     * Appelé par Symfony après l'authentification pour effacer les données sensibles.
     * Le hash est géré par Symfony — pas besoin de rien faire ici.
     */
    public function eraseCredentials(): void {}

    public function getNom(): ?string { return $this->nom; }
    public function setNom(string $nom): static { $this->nom = $nom; return $this; }

    public function getPrenom(): ?string { return $this->prenom; }
    public function setPrenom(string $prenom): static { $this->prenom = $prenom; return $this; }

    public function getTelephone(): ?string { return $this->telephone; }
    public function setTelephone(?string $telephone): static { $this->telephone = $telephone; return $this; }

    public function getTypeCompte(): ?string { return $this->typeCompte; }
    public function setTypeCompte(string $typeCompte): static { $this->typeCompte = $typeCompte; return $this; }

    public function isVerified(): bool { return $this->isVerified; }
    public function setIsVerified(bool $isVerified): static { $this->isVerified = $isVerified; return $this; }

    public function getCreatedAt(): ?\DateTimeImmutable { return $this->createdAt; }
    public function setCreatedAt(\DateTimeImmutable $createdAt): static { $this->createdAt = $createdAt; return $this; }

    public function getCguValidateAt(): ?\DateTimeImmutable { return $this->cguValidateAt; }
    public function setCguValidateAt(?\DateTimeImmutable $cguValidateAt): static { $this->cguValidateAt = $cguValidateAt; return $this; }

    public function getActivationToken(): ?string { return $this->activationToken; }
    public function setActivationToken(?string $activationToken): static { $this->activationToken = $activationToken; return $this; }

    public function getActivationTokenExpiresAt(): ?\DateTimeImmutable { return $this->activationTokenExpiresAt; }
    public function setActivationTokenExpiresAt(?\DateTimeImmutable $v): static { $this->activationTokenExpiresAt = $v; return $this; }

    public function getInactivatedAt(): ?\DateTimeImmutable { return $this->inactivatedAt; }
    public function setInactivatedAt(?\DateTimeImmutable $inactivatedAt): static { $this->inactivatedAt = $inactivatedAt; return $this; }

    public function getDeletedAt(): ?\DateTimeImmutable { return $this->deletedAt; }
    public function setDeletedAt(?\DateTimeImmutable $deletedAt): static { $this->deletedAt = $deletedAt; return $this; }

    public function getAssociation(): ?Association { return $this->association; }
    public function setAssociation(?Association $association): static { $this->association = $association; return $this; }

    // ── Helpers métier ───────────────────────────────────────────────────────

    /** Vérifie si le compte est suspendu */
    public function isInactive(): bool { return $this->inactivatedAt !== null; }

    /** Vérifie si le compte est soft-deleted */
    public function isDeleted(): bool { return $this->deletedAt !== null; }

    /** Vérifie si le token d'activation est encore valide */
    public function isActivationTokenValid(): bool
    {
        return $this->activationToken !== null
            && $this->activationTokenExpiresAt !== null
            && $this->activationTokenExpiresAt > new \DateTimeImmutable();
    }
}
