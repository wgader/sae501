<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\LegalContentRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: LegalContentRepository::class)]
#[ORM\Table(name: 'legal_content')]
class LegalContent
{
    public const TYPE_CGU = 'cgu';
    public const TYPE_MENTIONS_LEGALES = 'mentions_legales';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 50, unique: true)]
    private string $type;

    #[ORM\Column(length: 255)]
    private string $title;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $subtitle = null;

    #[ORM\Column(length: 50, nullable: true)]
    private ?string $lastUpdated = null;

    /**
     * @var list<array{title: string, text: string}>
     */
    #[ORM\Column(type: Types::JSON)]
    private array $sections = [];

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $updatedAt = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(onDelete: 'SET NULL')]
    private ?User $updatedBy = null;

    public function __construct(string $type = self::TYPE_CGU, string $title = '')
    {
        $this->type = $type;
        $this->title = $title;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getType(): string
    {
        return $this->type;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function setTitle(string $title): void
    {
        $this->title = trim($title);
    }

    public function getSubtitle(): ?string
    {
        return $this->subtitle;
    }

    public function setSubtitle(?string $subtitle): void
    {
        $this->subtitle = $subtitle !== null ? trim($subtitle) : null;
    }

    public function getLastUpdated(): ?string
    {
        return $this->lastUpdated;
    }

    public function setLastUpdated(?string $lastUpdated): void
    {
        $this->lastUpdated = $lastUpdated !== null ? trim($lastUpdated) : null;
    }

    /**
     * @return list<array{title: string, text: string}>
     */
    public function getSections(): array
    {
        return $this->sections;
    }

    /**
     * @param list<array{title: string, text: string}> $sections
     */
    public function setSections(array $sections): void
    {
        $this->sections = $sections;
    }

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function getUpdatedBy(): ?User
    {
        return $this->updatedBy;
    }

    public function touch(?User $agent): void
    {
        $this->updatedAt = new \DateTimeImmutable();
        $this->updatedBy = $agent;
    }
}
