<?php

namespace App\Entity;

use App\Repository\StockAdjustmentRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: StockAdjustmentRepository::class)]
#[ORM\Table(name: 'stock_adjustment')]
class StockAdjustment
{
    public const REASONS = [
        'Entrée de stock',
        'Casse',
        'Perte',
        'Maintenance',
        'Autre',
    ];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Materiel::class)]
    #[ORM\JoinColumn(name: 'materiel_id', referencedColumnName: 'id', nullable: false, onDelete: 'RESTRICT')]
    private ?Materiel $materiel = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'agent_id', referencedColumnName: 'id', nullable: false, onDelete: 'RESTRICT')]
    private ?User $agent = null;

    #[ORM\Column(name: 'previous_stock')]
    #[Assert\PositiveOrZero]
    private int $previousStock;

    #[ORM\Column(name: 'new_stock')]
    #[Assert\PositiveOrZero]
    private int $newStock;

    #[ORM\Column(length: 100)]
    #[Assert\Choice(choices: self::REASONS)]
    private string $reason;

    #[ORM\Column(name: 'created_at')]
    private \DateTimeImmutable $createdAt;

    public function __construct(
        Materiel $materiel,
        User $agent,
        int $previousStock,
        int $newStock,
        string $reason,
    ) {
        $this->materiel = $materiel;
        $this->agent = $agent;
        $this->previousStock = $previousStock;
        $this->newStock = $newStock;
        $this->reason = $reason;
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getMateriel(): ?Materiel
    {
        return $this->materiel;
    }

    public function getAgent(): ?User
    {
        return $this->agent;
    }

    public function getPreviousStock(): int
    {
        return $this->previousStock;
    }

    public function getNewStock(): int
    {
        return $this->newStock;
    }

    public function getReason(): string
    {
        return $this->reason;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }
}
