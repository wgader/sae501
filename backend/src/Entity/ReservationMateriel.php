<?php

namespace App\Entity;

use App\Repository\ReservationMaterielRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Représente une réservation de matériel formulée par une association.
 */
#[ORM\Entity(repositoryClass: ReservationMaterielRepository::class)]
#[ORM\Table(name: 'reservation_materiel')]
class ReservationMateriel
{
    public const STATUTS = [
        'En attente',
        'En cours de traitement',
        'Complément requis',
        'Validée',
        'Refusée',
        'Clôturée',
        'Matériel restitué',
    ];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Association::class)]
    #[ORM\JoinColumn(name: 'association_id', referencedColumnName: 'id', nullable: false)]
    private ?Association $association = null;

    #[ORM\Column(name: 'motif_evenement', length: 255)]
    #[Assert\NotBlank(message: "Le motif de l'événement est obligatoire.")]
    private ?string $motifEvenement = null;

    #[ORM\Column(name: 'date_retrait', type: Types::DATETIME_IMMUTABLE)]
    #[Assert\NotNull(message: 'La date de retrait est obligatoire.')]
    private ?\DateTimeImmutable $dateRetrait = null;

    #[ORM\Column(name: 'date_restitution', type: Types::DATETIME_IMMUTABLE)]
    #[Assert\NotNull(message: 'La date de restitution est obligatoire.')]
    private ?\DateTimeImmutable $dateRestitution = null;

    #[ORM\Column(length: 50)]
    #[Assert\Choice(choices: self::STATUTS)]
    private string $statut = 'En attente';

    #[ORM\Column(name: 'caution_montant', type: Types::DECIMAL, precision: 10, scale: 2, nullable: true)]
    private ?string $cautionMontant = null;

    #[ORM\Column(name: 'caution_payee_at', type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $cautionPayeeAt = null;

    #[ORM\Column(name: 'materiel_retire_at', type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $materielRetireAt = null;

    #[ORM\Column(name: 'materiel_restitue_at', type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $materielRestitueAt = null;

    #[ORM\Column(name: 'caution_rendue_at', type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $cautionRendueAt = null;

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_IMMUTABLE)]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(name: 'updated_at', type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $updatedAt = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $observations = null;

    /**
     * @var Collection<int, ReservationMaterielLigne>
     */
    #[ORM\OneToMany(targetEntity: ReservationMaterielLigne::class, mappedBy: 'reservationMateriel', cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $lignes;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->statut = 'En attente';
        $this->lignes = new ArrayCollection();
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

    public function getMotifEvenement(): ?string
    {
        return $this->motifEvenement;
    }

    public function setMotifEvenement(string $motifEvenement): static
    {
        $this->motifEvenement = $motifEvenement;

        return $this;
    }

    public function getDateRetrait(): ?\DateTimeImmutable
    {
        return $this->dateRetrait;
    }

    public function setDateRetrait(\DateTimeImmutable $dateRetrait): static
    {
        $this->dateRetrait = $dateRetrait;

        return $this;
    }

    public function getDateRestitution(): ?\DateTimeImmutable
    {
        return $this->dateRestitution;
    }

    public function setDateRestitution(\DateTimeImmutable $dateRestitution): static
    {
        $this->dateRestitution = $dateRestitution;

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

    public function getCautionMontant(): ?string
    {
        return $this->cautionMontant;
    }

    public function setCautionMontant(?string $cautionMontant): static
    {
        $this->cautionMontant = $cautionMontant;

        return $this;
    }

    public function getCautionPayeeAt(): ?\DateTimeImmutable
    {
        return $this->cautionPayeeAt;
    }

    public function setCautionPayeeAt(?\DateTimeImmutable $cautionPayeeAt): static
    {
        $this->cautionPayeeAt = $cautionPayeeAt;

        return $this;
    }

    public function getMaterielRetireAt(): ?\DateTimeImmutable
    {
        return $this->materielRetireAt;
    }

    public function setMaterielRetireAt(?\DateTimeImmutable $materielRetireAt): static
    {
        $this->materielRetireAt = $materielRetireAt;

        return $this;
    }

    public function getMaterielRestitueAt(): ?\DateTimeImmutable
    {
        return $this->materielRestitueAt;
    }

    public function setMaterielRestitueAt(?\DateTimeImmutable $materielRestitueAt): static
    {
        $this->materielRestitueAt = $materielRestitueAt;

        return $this;
    }

    public function getCautionRendueAt(): ?\DateTimeImmutable
    {
        return $this->cautionRendueAt;
    }

    public function setCautionRendueAt(?\DateTimeImmutable $cautionRendueAt): static
    {
        $this->cautionRendueAt = $cautionRendueAt;

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
            $ligne->setReservationMateriel($this);
        }

        return $this;
    }

    public function removeLigne(ReservationMaterielLigne $ligne): static
    {
        if ($this->lignes->removeElement($ligne)) {
            if ($ligne->getReservationMateriel() === $this) {
                $ligne->setReservationMateriel(null);
            }
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
}

