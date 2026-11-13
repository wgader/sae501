<?php

declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Metadata\ApiProperty;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use App\Repository\CampaignRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\Context\ExecutionContextInterface;

#[ORM\Entity(repositoryClass: CampaignRepository::class)]
#[ORM\Table(name: 'campaign')]
#[Assert\Callback('validateDates')]
#[ApiResource(
    operations: [
        new GetCollection(
            uriTemplate: '/admin/campaigns',
            security: "is_granted('ROLE_ADMIN') or is_granted('ROLE_GESTION_SALLE')",
        ),
        new Post(
            uriTemplate: '/admin/campaigns',
            security: "is_granted('ROLE_ADMIN') or is_granted('ROLE_GESTION_SALLE')",
        ),
        new Get(
            uriTemplate: '/admin/campaigns/{id}',
            security: "is_granted('ROLE_ADMIN') or is_granted('ROLE_GESTION_SALLE')",
        ),
        new Put(
            uriTemplate: '/admin/campaigns/{id}',
            security: "is_granted('ROLE_ADMIN') or is_granted('ROLE_GESTION_SALLE')",
        ),
        new Patch(
            uriTemplate: '/admin/campaigns/{id}',
            security: "is_granted('ROLE_ADMIN') or is_granted('ROLE_GESTION_SALLE')",
        ),
    ],
)]
class Campaign
{
    public const STATUS_PROGRAMMED = 'PROGRAMMED';
    public const STATUS_ACTIVE = 'ACTIVE';
    public const STATUS_CLOSED = 'CLOSED';

    public const STATUSES = [
        self::STATUS_PROGRAMMED,
        self::STATUS_ACTIVE,
        self::STATUS_CLOSED,
    ];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    // @phpstan-ignore property.unusedType
    private ?int $id = null;

    #[ORM\Column(length: 150)]
    #[Assert\NotBlank]
    #[Assert\Length(max: 150)]
    private ?string $seasonLabel = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    #[Assert\NotNull]
    private ?\DateTimeImmutable $openingAt = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    #[Assert\NotNull]
    private ?\DateTimeImmutable $closingAt = null;

    /**
     * @var list<string>
     */
    #[ORM\Column(type: Types::JSON)]
    private array $resourceTypes = [];

    #[ORM\Column(length: 20)]
    #[Assert\Choice(choices: self::STATUSES)]
    #[ApiProperty(writable: false)]
    private string $status = self::STATUS_PROGRAMMED;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $updatedAt;

    public function __construct()
    {
        $now = new \DateTimeImmutable();
        $this->createdAt = $now;
        $this->updatedAt = $now;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getSeasonLabel(): ?string
    {
        return $this->seasonLabel;
    }

    public function setSeasonLabel(string $seasonLabel): static
    {
        $this->seasonLabel = trim($seasonLabel);

        return $this;
    }

    public function getOpeningAt(): ?\DateTimeImmutable
    {
        return $this->openingAt;
    }

    public function setOpeningAt(\DateTimeImmutable $openingAt): static
    {
        $this->openingAt = $openingAt;

        return $this;
    }

    public function getClosingAt(): ?\DateTimeImmutable
    {
        return $this->closingAt;
    }

    public function setClosingAt(\DateTimeImmutable $closingAt): static
    {
        $this->closingAt = $closingAt;

        return $this;
    }

    /**
     * @return list<string>
     */
    public function getResourceTypes(): array
    {
        return $this->resourceTypes;
    }

    /**
     * @param list<string> $resourceTypes
     */
    public function setResourceTypes(array $resourceTypes): static
    {
        $this->resourceTypes = array_values(array_unique(array_filter(
            array_map(static fn (string $type): string => trim($type), $resourceTypes),
            static fn (string $type): bool => '' !== $type,
        )));

        return $this;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function getStatusLabel(): string
    {
        return match ($this->status) {
            self::STATUS_PROGRAMMED => 'Programmée',
            self::STATUS_ACTIVE => 'Active',
            self::STATUS_CLOSED => 'Clôturée',
            default => throw new \LogicException('Le statut de campagne est invalide.'),
        };
    }

    public function setStatus(string $status): static
    {
        if (!in_array($status, self::STATUSES, true)) {
            throw new \InvalidArgumentException('Le statut de campagne est invalide.');
        }

        $this->status = $status;

        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): \DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function touch(): static
    {
        $this->updatedAt = new \DateTimeImmutable();

        return $this;
    }

    public function validateDates(ExecutionContextInterface $context): void
    {
        if (null !== $this->openingAt && null !== $this->closingAt && $this->closingAt <= $this->openingAt) {
            $context->buildViolation('La clôture doit être postérieure à l’ouverture.')
                ->atPath('closingAt')
                ->addViolation();
        }
    }
}
