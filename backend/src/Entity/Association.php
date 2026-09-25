<?php

namespace App\Entity;

use App\Repository\AssociationRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: AssociationRepository::class)]
class Association
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $nom = null;

    #[ORM\Column(length: 20)]
    private ?string $numeroRna = null;

    #[ORM\Column(length: 14)]
    private ?string $numeroSiret = null;

    #[ORM\Column(type: Types::DATE_IMMUTABLE)]
    private ?\DateTimeImmutable $dateCreation = null;

    #[ORM\Column]
    private ?int $nombreMembres = null;

    #[ORM\Column(length: 50)]
    private ?string $categorieActivite = null;

    #[ORM\Column(type: Types::TEXT)]
    private ?string $objet = null;

    #[ORM\Column(length: 255)]
    private ?string $adresseSiegeSocial = null;

    #[ORM\Column(length: 255)]
    private ?string $siteWeb = null;

    #[ORM\Column(length: 30)]
    private ?string $statut = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    /**
     * @var Collection<int, User>
     */
    #[ORM\OneToMany(targetEntity: User::class, mappedBy: 'association')]
    private Collection $users;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->statut = 'PENDING_VALIDATION';
        $this->users = new \Doctrine\Common\Collections\ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getNom(): ?string
    {
        return $this->nom;
    }

    public function setNom(string $nom): static
    {
        $this->nom = $nom;

        return $this;
    }

    public function getNumeroRna(): ?string
    {
        return $this->numeroRna;
    }

    public function setNumeroRna(string $numeroRna): static
    {
        $this->numeroRna = $numeroRna;

        return $this;
    }

    public function getNumeroSiret(): ?string
    {
        return $this->numeroSiret;
    }

    public function setNumeroSiret(string $numeroSiret): static
    {
        $this->numeroSiret = $numeroSiret;

        return $this;
    }

    public function getDateCreation(): ?\DateTimeImmutable
    {
        return $this->dateCreation;
    }

    public function setDateCreation(\DateTimeImmutable $dateCreation): static
    {
        $this->dateCreation = $dateCreation;

        return $this;
    }

    public function getNombreMembres(): ?int
    {
        return $this->nombreMembres;
    }

    public function setNombreMembres(int $nombreMembres): static
    {
        $this->nombreMembres = $nombreMembres;

        return $this;
    }

    public function getCategorieActivite(): ?string
    {
        return $this->categorieActivite;
    }

    public function setCategorieActivite(string $categorieActivite): static
    {
        $this->categorieActivite = $categorieActivite;

        return $this;
    }

    public function getObjet(): ?string
    {
        return $this->objet;
    }

    public function setObjet(string $objet): static
    {
        $this->objet = $objet;

        return $this;
    }

    public function getAdresseSiegeSocial(): ?string
    {
        return $this->adresseSiegeSocial;
    }

    public function setAdresseSiegeSocial(string $adresseSiegeSocial): static
    {
        $this->adresseSiegeSocial = $adresseSiegeSocial;

        return $this;
    }

    public function getSiteWeb(): ?string
    {
        return $this->siteWeb;
    }

    public function setSiteWeb(string $siteWeb): static
    {
        $this->siteWeb = $siteWeb;

        return $this;
    }

    public function getStatut(): ?string
    {
        return $this->statut;
    }

    public function setStatut(string $statut): static
    {
        $this->statut = $statut;

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
     * @return Collection<int, User>
     */
    public function getUsers(): Collection
    {
        return $this->users;
    }

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
            // set the owning side to null (unless already changed)
            if ($user->getAssociation() === $this) {
                $user->setAssociation(null);
            }
        }

        return $this;
    }
}
