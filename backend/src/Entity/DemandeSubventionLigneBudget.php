<?php

declare(strict_types=1);

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'demande_subvention_ligne_budget')]
class DemandeSubventionLigneBudget
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: DemandeSubvention::class, inversedBy: 'lignesBudget')]
    #[ORM\JoinColumn(name: 'demande_subvention_id', nullable: false, onDelete: 'CASCADE')]
    private ?DemandeSubvention $demandeSubvention = null;

    #[ORM\Column(name: 'type_ligne', length: 20)]
    private string $typeLigne = 'depense';

    #[ORM\Column(length: 60)]
    private string $categorie = '';

    #[ORM\Column(length: 255)]
    private string $intitule = '';

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    private string $montant = '0.00';

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getDemandeSubvention(): ?DemandeSubvention
    {
        return $this->demandeSubvention;
    }

    public function setDemandeSubvention(?DemandeSubvention $demandeSubvention): static
    {
        $this->demandeSubvention = $demandeSubvention;

        return $this;
    }

    public function getTypeLigne(): string
    {
        return $this->typeLigne;
    }

    public function setTypeLigne(string $typeLigne): static
    {
        $this->typeLigne = $typeLigne;

        return $this;
    }

    public function getCategorie(): string
    {
        return $this->categorie;
    }

    public function setCategorie(string $categorie): static
    {
        $this->categorie = $categorie;

        return $this;
    }

    public function getIntitule(): string
    {
        return $this->intitule;
    }

    public function setIntitule(string $intitule): static
    {
        $this->intitule = $intitule;

        return $this;
    }

    public function getMontant(): string
    {
        return $this->montant;
    }

    public function setMontant(string $montant): static
    {
        $this->montant = $montant;

        return $this;
    }
}
