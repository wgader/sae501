<?php

namespace App\Entity;

use App\Repository\EquipmentCategoryRepository;
use Doctrine\ORM\Mapping as ORM;

/**
 * Catégorie du catalogue de matériel. Materiel::$categorie garde le code : renommer une
 * catégorie ne touche donc pas aux équipements déjà classés.
 */
#[ORM\Entity(repositoryClass: EquipmentCategoryRepository::class)]
#[ORM\Table(name: 'equipment_category')]
#[ORM\UniqueConstraint(name: 'uniq_equipment_category_code', columns: ['code'])]
#[ORM\UniqueConstraint(name: 'uniq_equipment_category_label', columns: ['label'])]
class EquipmentCategory
{
    public const LABEL_MAX_LENGTH = 100;

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 100)]
    private string $code;

    #[ORM\Column(length: self::LABEL_MAX_LENGTH)]
    private string $label;

    public function __construct(string $code, string $label)
    {
        $this->code = $code;
        $this->label = $label;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCode(): string
    {
        return $this->code;
    }

    public function getLabel(): string
    {
        return $this->label;
    }

    public function rename(string $label): void
    {
        $this->label = $label;
    }
}
