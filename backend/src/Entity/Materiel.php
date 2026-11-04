<?php

namespace App\Entity;

use App\Repository\MaterielRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Représente un équipement du parc matériel communal.
 */
#[ORM\Entity(repositoryClass: MaterielRepository::class)]
#[ORM\Table(name: 'materiel')]
class Materiel
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank(message: 'La désignation du matériel est obligatoire.')]
    #[Assert\Length(max: 255)]
    private ?string $designation = null;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank(message: 'La catégorie est obligatoire.')]
    #[Assert\Length(max: 100)]
    private ?string $categorie = null;

    #[ORM\Column(name: 'reference_interne', length: 50, nullable: true)]
    #[Assert\Length(max: 50)]
    private ?string $referenceInterne = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    #[ORM\Column(name: 'consignes_utilisation', type: Types::TEXT, nullable: true)]
    private ?string $consignesUtilisation = null;

    #[ORM\Column(name: 'stock_total')]
    #[Assert\NotNull(message: 'Le stock total est obligatoire.')]
    #[Assert\PositiveOrZero(message: 'Le stock total doit être un entier positif ou nul.')]
    private ?int $stockTotal = 0;

    #[ORM\Column(name: 'is_archived', options: ['default' => false])]
    private bool $isArchived = false;

    #[ORM\Column(name: 'image_path', length: 255, nullable: true)]
    private ?string $imagePath = null;

    #[ORM\Column(name: 'created_at')]
    private ?\DateTimeImmutable $createdAt = null;

    /**
     * @var Collection<int, ReservationMaterielLigne>
     */
    #[ORM\OneToMany(targetEntity: ReservationMaterielLigne::class, mappedBy: 'materiel')]
    private Collection $lignes;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->isArchived = false;
        $this->lignes = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getDesignation(): ?string
    {
        return $this->designation;
    }

    public function setDesignation(string $designation): static
    {
        $this->designation = $designation;

        return $this;
    }

    public function getCategorie(): ?string
    {
        return $this->categorie;
    }

    public function setCategorie(string $categorie): static
    {
        $this->categorie = $categorie;

        return $this;
    }

    public function getReferenceInterne(): ?string
    {
        return $this->referenceInterne;
    }

    public function setReferenceInterne(?string $referenceInterne): static
    {
        $this->referenceInterne = $referenceInterne;

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

    public function getConsignesUtilisation(): ?string
    {
        return $this->consignesUtilisation;
    }

    public function setConsignesUtilisation(?string $consignesUtilisation): static
    {
        $this->consignesUtilisation = $consignesUtilisation;

        return $this;
    }

    public function getStockTotal(): ?int
    {
        return $this->stockTotal;
    }

    public function setStockTotal(int $stockTotal): static
    {
        $this->stockTotal = $stockTotal;

        return $this;
    }

    public function isArchived(): bool
    {
        return $this->isArchived;
    }

    public function setIsArchived(bool $isArchived): static
    {
        $this->isArchived = $isArchived;

        return $this;
    }

    public function getImagePath(): ?string
    {
        return $this->imagePath;
    }

    public function setImagePath(?string $imagePath): static
    {
        $this->imagePath = $imagePath;

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

    /**
     * @return Collection<int, ReservationMaterielLigne>
     */
    public function getLignes(): Collection
    {
        return $this->lignes;
    }

    public function addLigne(ReservationMaterielLigne $ligne): static
    {
        if (!$this->lignes->contains($ligne)) {
            $this->lignes->add($ligne);
            $ligne->setMateriel($this);
        }

        return $this;
    }

    public function removeLigne(ReservationMaterielLigne $ligne): static
    {
        if ($this->lignes->removeElement($ligne)) {
            if ($ligne->getMateriel() === $this) {
                // Relational integrity kept
            }
        }

        return $this;
    }
}

