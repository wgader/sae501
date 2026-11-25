<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\GrantResourceRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: GrantResourceRepository::class)]
#[ORM\Table(name: 'grant_resource')]
class GrantResource
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private string $label;

    #[ORM\Column(length: 500)]
    private string $url;

    #[ORM\Column(type: Types::BOOLEAN, options: ['default' => false])]
    private bool $isExternal = false;

    #[ORM\Column(type: Types::INTEGER, options: ['default' => 0])]
    private int $displayOrder = 0;

    public function __construct(string $label = '', string $url = '', bool $isExternal = false, int $displayOrder = 0)
    {
        $this->label = $label;
        $this->url = $url;
        $this->isExternal = $isExternal;
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

    public function getUrl(): string
    {
        return $this->url;
    }

    public function setUrl(string $url): void
    {
        $this->url = trim($url);
    }

    public function isExternal(): bool
    {
        return $this->isExternal;
    }

    public function setIsExternal(bool $isExternal): void
    {
        $this->isExternal = $isExternal;
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
