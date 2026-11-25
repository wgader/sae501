<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\CampaignWishSubmissionRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * Dossier de vœux déposé par une association pendant une campagne annuelle : il regroupe les
 * créneaux récurrents demandés pour la saison et fait l'objet d'un seul accusé de réception.
 */
#[ORM\Entity(repositoryClass: CampaignWishSubmissionRepository::class)]
#[ORM\Table(name: 'campaign_wish_submission')]
class CampaignWishSubmission
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Campaign::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Campaign $campaign = null;

    #[ORM\ManyToOne(targetEntity: Association::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Association $association = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?User $submittedBy = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $submittedAt;

    /** @var Collection<int, CampaignWish> */
    #[ORM\OneToMany(targetEntity: CampaignWish::class, mappedBy: 'submission', cascade: ['persist'], orphanRemoval: true)]
    #[ORM\OrderBy(['dayOfWeek' => 'ASC', 'startTime' => 'ASC'])]
    private Collection $wishes;

    public function __construct(Campaign $campaign, Association $association, ?User $submittedBy)
    {
        $this->campaign = $campaign;
        $this->association = $association;
        $this->submittedBy = $submittedBy;
        $this->submittedAt = new \DateTimeImmutable();
        $this->wishes = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCampaign(): ?Campaign
    {
        return $this->campaign;
    }

    public function getAssociation(): ?Association
    {
        return $this->association;
    }

    public function getSubmittedBy(): ?User
    {
        return $this->submittedBy;
    }

    public function getSubmittedAt(): \DateTimeImmutable
    {
        return $this->submittedAt;
    }

    /** @return Collection<int, CampaignWish> */
    public function getWishes(): Collection
    {
        return $this->wishes;
    }

    public function addWish(CampaignWish $wish): static
    {
        if (!$this->wishes->contains($wish)) {
            $this->wishes->add($wish);
            $wish->setSubmission($this);
        }

        return $this;
    }
}
