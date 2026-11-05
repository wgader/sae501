<?php

namespace App\Entity;

use App\Repository\DemandeStatusHistoryRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Journalise les changements de statut et les événements horodatés pour chaque démarche.
 */
#[ORM\Entity(repositoryClass: DemandeStatusHistoryRepository::class)]
#[ORM\Table(name: 'demande_status_history')]
#[ORM\Index(name: 'idx_demande_lookup', columns: ['demande_type', 'demande_id'])]
class DemandeStatusHistory
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: 'demande_type', length: 30)]
    #[Assert\Choice(choices: ['materiel', 'subvention', 'salle'])]
    private string $demandeType;

    #[ORM\Column(name: 'demande_id', type: Types::INTEGER)]
    private int $demandeId;

    #[ORM\Column(length: 50)]
    private string $statut;

    #[ORM\Column(length: 255)]
    private string $label;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $commentaire = null;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $auteur = null;

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $createdAt;

    public function __construct(
        string $demandeType,
        int $demandeId,
        string $statut,
        string $label,
        ?string $commentaire = null,
        ?string $auteur = 'Mairie de Feytiat',
        ?\DateTimeImmutable $createdAt = null,
    ) {
        $this->demandeType = $demandeType;
        $this->demandeId = $demandeId;
        $this->statut = $statut;
        $this->label = $label;
        $this->commentaire = $commentaire;
        $this->auteur = $auteur;
        $this->createdAt = $createdAt ?? new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getDemandeType(): string
    {
        return $this->demandeType;
    }

    public function setDemandeType(string $demandeType): static
    {
        $this->demandeType = $demandeType;

        return $this;
    }

    public function getDemandeId(): int
    {
        return $this->demandeId;
    }

    public function setDemandeId(int $demandeId): static
    {
        $this->demandeId = $demandeId;

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

    public function getLabel(): string
    {
        return $this->label;
    }

    public function setLabel(string $label): static
    {
        $this->label = $label;

        return $this;
    }

    public function getCommentaire(): ?string
    {
        return $this->commentaire;
    }

    public function setCommentaire(?string $commentaire): static
    {
        $this->commentaire = $commentaire;

        return $this;
    }

    public function getAuteur(): ?string
    {
        return $this->auteur;
    }

    public function setAuteur(?string $auteur): static
    {
        $this->auteur = $auteur;

        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): static
    {
        $this->createdAt = $createdAt;

        return $this;
    }
}

