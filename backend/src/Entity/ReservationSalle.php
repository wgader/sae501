<?php

namespace App\Entity;

use App\Repository\ReservationSalleRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Représente une réservation de salle municipale effectuée par une association.
 */
#[ORM\Entity(repositoryClass: ReservationSalleRepository::class)]
#[ORM\Table(name: 'reservation_salle')]
class ReservationSalle
{
    public const STATUTS = [
        'En cours de traitement',
        'Complément requis',
        'Validée',
        'Refusée',
        'Clôturée',
    ];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Association::class)]
    #[ORM\JoinColumn(name: 'association_id', referencedColumnName: 'id', nullable: false)]
    private ?Association $association = null;

    #[ORM\ManyToOne(targetEntity: Salle::class)]
    #[ORM\JoinColumn(name: 'salle_id', referencedColumnName: 'id', nullable: false)]
    private ?Salle $salle = null;

    #[ORM\Column(name: 'motif_evenement', length: 255)]
    #[Assert\NotBlank(message: "Le motif de l'événement est obligatoire.")]
    private ?string $motifEvenement = null;

    #[ORM\Column(name: 'date_debut', type: Types::DATETIME_IMMUTABLE)]
    #[Assert\NotNull(message: 'La date de début est obligatoire.')]
    private ?\DateTimeImmutable $dateDebut = null;

    #[ORM\Column(name: 'date_fin', type: Types::DATETIME_IMMUTABLE)]
    #[Assert\NotNull(message: 'La date de fin est obligatoire.')]
    private ?\DateTimeImmutable $dateFin = null;

    #[ORM\Column(name: 'capacite_attendue', type: Types::INTEGER, nullable: true)]
    private ?int $capaciteAttendue = null;

    #[ORM\Column(length: 50)]
    #[Assert\Choice(choices: self::STATUTS)]
    private string $statut = 'En cours de traitement';

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

    public function getSalle(): ?Salle
    {
        return $this->salle;
    }

    public function setSalle(?Salle $salle): static
    {
        $this->salle = $salle;

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

    public function getDateDebut(): ?\DateTimeImmutable
    {
        return $this->dateDebut;
    }

    public function setDateDebut(\DateTimeImmutable $dateDebut): static
    {
        $this->dateDebut = $dateDebut;

        return $this;
    }

    public function getDateFin(): ?\DateTimeImmutable
    {
        return $this->dateFin;
    }

    public function setDateFin(\DateTimeImmutable $dateFin): static
    {
        $this->dateFin = $dateFin;

        return $this;
    }

    public function getCapaciteAttendue(): ?int
    {
        return $this->capaciteAttendue;
    }

    public function setCapaciteAttendue(?int $capaciteAttendue): static
    {
        $this->capaciteAttendue = $capaciteAttendue;

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

