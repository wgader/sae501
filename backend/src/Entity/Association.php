<?php

namespace App\Entity;

use App\Repository\AssociationRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Représente une association inscrite sur la plateforme.
 *
 * Seul le nom est obligatoire à l'inscription.
 * nombreMembres est renseigné ultérieurement (demande de subvention, etc.).
 *
 * Statuts :
 *   PENDING_VALIDATION → en attente de validation par la mairie
 *   VALIDATED          → validée par la mairie, lien d'activation envoyé
 *   REFUSED            → refusée par la mairie
 *   SUSPENDED          → suspendue par l'admin
 *
 * Modules activés par la mairie selon les besoins de l'association.
 */
#[ORM\Entity(repositoryClass: AssociationRepository::class)]
class Association
{
    public const STATUTS = [
        'PENDING_VALIDATION',
        'VALIDATED',
        'REFUSED',
        'SUSPENDED',
    ];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    /** Seul champ obligatoire à l'inscription */
    #[ORM\Column(length: 255)]
    #[Assert\NotBlank(message: "Le nom de l'association est obligatoire.")]
    #[Assert\Length(max: 255)]
    private ?string $nom = null;

    /** Renseigné plus tard (demande de subvention, profil, etc.) */
    #[ORM\Column(nullable: true)]
    #[Assert\Positive(message: "Le nombre de membres doit être positif.")]
    private ?int $nombreMembres = null;

    /**
     * PENDING_VALIDATION → en attente de validation par la mairie
     * VALIDATED          → validée, lien d'activation envoyé à l'asso
     * REFUSED            → refusée par la mairie
     * SUSPENDED          → suspendue par l'admin
     */
    #[ORM\Column(length: 30)]
    #[Assert\Choice(choices: self::STATUTS)]
    private ?string $statut = 'PENDING_VALIDATION';

    /** Modules activés/désactivés par la mairie depuis l'interface admin */
    #[ORM\Column(options: ['default' => false])]
    private bool $moduleSubventionActif = false;

    #[ORM\Column(options: ['default' => false])]
    private bool $moduleMaterielActif = false;

    #[ORM\Column(options: ['default' => false])]
    private bool $moduleSalleActif = false;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    /** Date de validation par la mairie — null tant que PENDING_VALIDATION */
    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $valideAt = null;

    /** @var Collection<int, User> */
    #[ORM\OneToMany(targetEntity: User::class, mappedBy: 'association')]
    private Collection $users;

    /** @var Collection<int, DocumentJustificatif> */
    #[ORM\OneToMany(targetEntity: DocumentJustificatif::class, mappedBy: 'association')]
    private Collection $documentJustificatifs;

    public function __construct()
    {
        $this->createdAt             = new \DateTimeImmutable();
        $this->statut                = 'PENDING_VALIDATION';
        $this->moduleSubventionActif = false;
        $this->moduleMaterielActif   = false;
        $this->moduleSalleActif      = false;
        $this->users                 = new ArrayCollection();
        $this->documentJustificatifs = new ArrayCollection();
    }

    // ── Getters / Setters ────────────────────────────────────────────────────

    public function getId(): ?int { return $this->id; }

    public function getNom(): ?string { return $this->nom; }
    public function setNom(string $nom): static { $this->nom = $nom; return $this; }

    public function getNombreMembres(): ?int { return $this->nombreMembres; }
    public function setNombreMembres(?int $v): static { $this->nombreMembres = $v; return $this; }

    public function getStatut(): ?string { return $this->statut; }
    public function setStatut(string $statut): static { $this->statut = $statut; return $this; }

    public function isModuleSubventionActif(): bool { return $this->moduleSubventionActif; }
    public function setModuleSubventionActif(bool $v): static { $this->moduleSubventionActif = $v; return $this; }

    public function isModuleMaterielActif(): bool { return $this->moduleMaterielActif; }
    public function setModuleMaterielActif(bool $v): static { $this->moduleMaterielActif = $v; return $this; }

    public function isModuleSalleActif(): bool { return $this->moduleSalleActif; }
    public function setModuleSalleActif(bool $v): static { $this->moduleSalleActif = $v; return $this; }

    public function getCreatedAt(): ?\DateTimeImmutable { return $this->createdAt; }
    public function setCreatedAt(\DateTimeImmutable $v): static { $this->createdAt = $v; return $this; }

    public function getValideAt(): ?\DateTimeImmutable { return $this->valideAt; }
    public function setValideAt(?\DateTimeImmutable $v): static { $this->valideAt = $v; return $this; }

    /** @return Collection<int, User> */
    public function getUsers(): Collection { return $this->users; }

    public function addUser(User $user): static
    {
        if (!$this->users->contains($user)) {
            $this->users->add($user);
            $user->setAssociation($this);
        }
        return $this;
    }

    public function removeUser(User $user): static
    {
        if ($this->users->removeElement($user)) {
            if ($user->getAssociation() === $this) {
                $user->setAssociation(null);
            }
        }
        return $this;
    }

    /** @return Collection<int, DocumentJustificatif> */
    public function getDocumentJustificatifs(): Collection { return $this->documentJustificatifs; }

    public function addDocumentJustificatif(DocumentJustificatif $doc): static
    {
        if (!$this->documentJustificatifs->contains($doc)) {
            $this->documentJustificatifs->add($doc);
            $doc->setAssociation($this);
        }
        return $this;
    }

    public function removeDocumentJustificatif(DocumentJustificatif $doc): static
    {
        if ($this->documentJustificatifs->removeElement($doc)) {
            if ($doc->getAssociation() === $this) {
                $doc->setAssociation(null);
            }
        }
        return $this;
    }

    // ── Helpers métier ───────────────────────────────────────────────────────

    /** L'association est en attente de validation */
    public function isPending(): bool { return $this->statut === 'PENDING_VALIDATION'; }

    /** L'association a été validée par la mairie */
    public function isValidated(): bool { return $this->statut === 'VALIDATED'; }

    /** L'association a été refusée par la mairie */
    public function isRefused(): bool { return $this->statut === 'REFUSED'; }

    /** L'association est suspendue */
    public function isSuspended(): bool { return $this->statut === 'SUSPENDED'; }
}