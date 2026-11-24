<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\GrantDocumentTypeRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: GrantDocumentTypeRepository::class)]
#[ORM\Table(name: 'grant_document_type')]
class GrantDocumentType
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 150, unique: true)]
    private string $label;

    #[ORM\Column(type: Types::BOOLEAN, options: ['default' => false])]
    private bool $isRequired = false;

    #[ORM\Column(type: Types::INTEGER, options: ['default' => 0])]
    private int $displayOrder = 0;

    public function __construct(string $label = '', bool $isRequired = false, int $displayOrder = 0)
    {
        $this->label = $label;
        $this->isRequired = $isRequired;
        $this->displayOrder = $displayOrder;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getLabel(): string
    {
        return $this->label;
    }

    public function setLabel(string $label): void
    {
        $this->label = trim($label);
    }

    public function isRequired(): bool
    {
        return $this->isRequired;
    }

    public function setIsRequired(bool $isRequired): void
    {
        $this->isRequired = $isRequired;
    }

    public function getDisplayOrder(): int
    {
        return $this->displayOrder;
    }

    public function setDisplayOrder(int $displayOrder): void
    {
        $this->displayOrder = $displayOrder;
    }
}
