<?php

namespace App\Entity;

use App\Repository\ReservationMaterielLigneRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Ligne de réservation détaillant le matériel et la quantité empruntée.
 */
#[ORM\Entity(repositoryClass: ReservationMaterielLigneRepository::class)]
#[ORM\Table(name: 'reservation_materiel_ligne')]
class ReservationMaterielLigne
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: ReservationMateriel::class, inversedBy: 'lignes')]
    #[ORM\JoinColumn(name: 'reservation_materiel_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?ReservationMateriel $reservationMateriel = null;

    #[ORM\ManyToOne(targetEntity: Materiel::class, inversedBy: 'lignes')]
    #[ORM\JoinColumn(name: 'materiel_id', referencedColumnName: 'id', nullable: false, onDelete: 'RESTRICT')]
    private ?Materiel $materiel = null;

    #[ORM\Column]
    #[Assert\NotNull(message: 'La quantité est obligatoire.')]
    #[Assert\Positive(message: 'La quantité doit être strictement positive.')]
    private ?int $quantite = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getReservationMateriel(): ?ReservationMateriel
    {
        return $this->reservationMateriel;
    }

    public function setReservationMateriel(?ReservationMateriel $reservationMateriel): static
    {
        $this->reservationMateriel = $reservationMateriel;

        return $this;
    }

    public function getMateriel(): ?Materiel
    {
        return $this->materiel;
    }

    public function setMateriel(?Materiel $materiel): static
    {
        $this->materiel = $materiel;

        return $this;
    }

    public function getQuantite(): ?int
    {
        return $this->quantite;
    }

    public function setQuantite(int $quantite): static
    {
        $this->quantite = $quantite;

        return $this;
    }
}

