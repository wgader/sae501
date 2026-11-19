<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Repository\DemandeSubventionRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Ignore;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Représente un dossier de demande de subvention déposé par une association.
 */
#[ORM\Entity(repositoryClass: DemandeSubventionRepository::class)]
#[ORM\Table(name: 'demande_subvention')]
#[ApiResource(
    operations: [new GetCollection(), new Get()],
    security: "is_granted('ROLE_ADMIN') or is_granted('ROLE_GESTION_SUBVENTION')",
    paginationItemsPerPage: 20,
    paginationMaximumItemsPerPage: 100,
)]
class DemandeSubvention
{
    public const STATUTS = [
        'En attente',
        'En cours de traitement',
        'Complément requis',
        'Validée',
        'Refusée',
        'Clôturée',
        'Brouillon',
    ];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Association::class)]
    #[ORM\JoinColumn(name: 'association_id', referencedColumnName: 'id', nullable: false)]
    private ?Association $association = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank(message: "L'intitulé du projet est obligatoire.")]
    private ?string $intituleProjet = null;

    #[ORM\Column(length: 50)]
    private string $typeSubvention = 'Fonctionnement';

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    #[ORM\Column(name: 'public_cible', type: Types::TEXT, nullable: true)]
    private ?string $publicCible = null;

    #[ORM\Column(name: 'date_debut_projet', type: Types::DATE_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $dateDebutProjet = null;

    #[ORM\Column(name: 'date_fin_projet', type: Types::DATE_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $dateFinProjet = null;

    #[ORM\Column(name: 'montant_demande', type: Types::DECIMAL, precision: 10, scale: 2)]
    #[Assert\NotNull(message: 'Le montant demandé est obligatoire.')]
    #[Assert\Positive(message: 'Le montant demandé doit être positif.')]
    private ?string $montantDemande = null;

    // Coordonnées bancaires : jamais exposées par la ressource API générique.
    #[Ignore]
    #[ORM\Column(name: 'bic', length: 11, nullable: true)]
    private ?string $bic = null;

    #[Ignore]
    #[ORM\Column(name: 'iban', length: 34, nullable: true)]
    private ?string $iban = null;

    #[ORM\Column(name: 'montant_accorde', type: Types::DECIMAL, precision: 10, scale: 2, nullable: true)]
    private ?string $montantAccorde = null;

    #[ORM\Column(name: 'annee_exercice', type: Types::INTEGER)]
    private int $anneeExercice;

    #[ORM\Column(length: 50)]
    #[Assert\Choice(choices: self::STATUTS)]
    private string $statut = 'En cours de traitement';

    #[ORM\Column(name: 'budget_valide', options: ['default' => false])]
    private bool $budgetValide = false;

    /** @var Collection<int, DemandeSubventionLigneBudget> */
    #[ORM\OneToMany(
        targetEntity: DemandeSubventionLigneBudget::class,
        mappedBy: 'demandeSubvention',
        cascade: ['persist'],
        orphanRemoval: true,
    )]
    private Collection $lignesBudget;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $observations = null;

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_IMMUTABLE)]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(name: 'updated_at', type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $updatedAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->statut = 'En cours de traitement';
        $this->anneeExercice = (int) (new \DateTimeImmutable())->format('Y');
        $this->lignesBudget = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getAssociation(): ?Association
    {
        return $this->association;
    }

    public function setAssociation(?Association $association): static
    {
        $this->association = $association;

        return $this;
    }

    public function getIntituleProjet(): ?string
    {
        return $this->intituleProjet;
    }

    public function setIntituleProjet(string $intituleProjet): static
    {
        $this->intituleProjet = $intituleProjet;

        return $this;
    }

    public function getTypeSubvention(): string
    {
        return $this->typeSubvention;
    }

    public function setTypeSubvention(string $typeSubvention): static
    {
        $this->typeSubvention = $typeSubvention;

        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        $this->description = $description;

        return $this;
    }

    public function getPublicCible(): ?string
    {
        return $this->publicCible;
    }

    public function setPublicCible(?string $publicCible): static
    {
        $this->publicCible = $publicCible;

        return $this;
    }

    public function getDateDebutProjet(): ?\DateTimeImmutable
    {
        return $this->dateDebutProjet;
    }

    public function setDateDebutProjet(?\DateTimeImmutable $dateDebutProjet): static
    {
        $this->dateDebutProjet = $dateDebutProjet;

        return $this;
    }

    public function getDateFinProjet(): ?\DateTimeImmutable
    {
        return $this->dateFinProjet;
    }

    public function setDateFinProjet(?\DateTimeImmutable $dateFinProjet): static
    {
        $this->dateFinProjet = $dateFinProjet;

        return $this;
    }

    public function getMontantDemande(): ?string
    {
        return $this->montantDemande;
    }

    public function setMontantDemande(string $montantDemande): static
    {
        $this->montantDemande = $montantDemande;

        return $this;
    }

    public function getBic(): ?string
    {
        return $this->bic;
    }

    public function setBic(?string $bic): static
    {
        $this->bic = $bic;

        return $this;
    }

    public function getIban(): ?string
    {
        return $this->iban;
    }

    public function setIban(?string $iban): static
    {
        $this->iban = $iban;

        return $this;
    }

    public function getMontantAccorde(): ?string
    {
        return $this->montantAccorde;
    }

    public function setMontantAccorde(?string $montantAccorde): static
    {
        $this->montantAccorde = $montantAccorde;

        return $this;
    }

    public function getAnneeExercice(): int
    {
        return $this->anneeExercice;
    }

    public function setAnneeExercice(int $anneeExercice): static
    {
        $this->anneeExercice = $anneeExercice;

        return $this;
    }

    public function getStatut(): string
    {
        return $this->statut;
    }

    public function setStatut(string $statut): static
    {
        $this->statut = $statut;

        return $this;
    }

    public function isBudgetValide(): bool
    {
        return $this->budgetValide;
    }

    public function setBudgetValide(bool $budgetValide): static
    {
        $this->budgetValide = $budgetValide;

        return $this;
    }

    /** @return Collection<int, DemandeSubventionLigneBudget> */
    public function getLignesBudget(): Collection
    {
        return $this->lignesBudget;
    }

    public function clearLignesBudget(): static
    {
        foreach ($this->lignesBudget->toArray() as $ligne) {
            $this->lignesBudget->removeElement($ligne);
            $ligne->setDemandeSubvention(null);
        }

        return $this;
    }

    public function addLigneBudget(DemandeSubventionLigneBudget $ligne): static
    {
        if (!$this->lignesBudget->contains($ligne)) {
            $this->lignesBudget->add($ligne);
            $ligne->setDemandeSubvention($this);
        }

        return $this;
    }

    public function getObservations(): ?string
    {
        return $this->observations;
    }

    public function setObservations(?string $observations): static
    {
        $this->observations = $observations;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): static
    {
        $this->createdAt = $createdAt;

        return $this;
    }

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(?\DateTimeImmutable $updatedAt): static
    {
        $this->updatedAt = $updatedAt;

        return $this;
    }
}
