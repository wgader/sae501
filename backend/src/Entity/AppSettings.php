<?php

namespace App\Entity;

use App\Repository\AppSettingsRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * Réglages de la plateforme, modifiables par la mairie. Une seule ligne : tant qu'elle
 * n'existe pas, les valeurs par défaut ci-dessous s'appliquent.
 */
#[ORM\Entity(repositoryClass: AppSettingsRepository::class)]
#[ORM\Table(name: 'app_settings')]
class AppSettings
{
    public const DEFAULT_ROOM_OPENING_HOUR = 8;
    public const DEFAULT_ROOM_CLOSING_HOUR = 23;
    public const DEFAULT_ROOM_ONE_OFF_MAX_DAYS = 3;
    public const DEFAULT_EQUIPMENT_DESK_OPENING = '08:00';
    public const DEFAULT_EQUIPMENT_DESK_CLOSING = '19:00';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(type: Types::SMALLINT)]
    private int $roomOpeningHour = self::DEFAULT_ROOM_OPENING_HOUR;

    #[ORM\Column(type: Types::SMALLINT)]
    private int $roomClosingHour = self::DEFAULT_ROOM_CLOSING_HOUR;

    #[ORM\Column(type: Types::SMALLINT)]
    private int $roomOneOffMaxDays = self::DEFAULT_ROOM_ONE_OFF_MAX_DAYS;

    /** Heures du service de prêt : le retrait et la restitution se font dans ce créneau. */
    #[ORM\Column(length: 5)]
    private string $equipmentDeskOpening = self::DEFAULT_EQUIPMENT_DESK_OPENING;

    #[ORM\Column(length: 5)]
    private string $equipmentDeskClosing = self::DEFAULT_EQUIPMENT_DESK_CLOSING;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $equipmentPickupLocation = null;

    /** Quantité maximale d'un même équipement par demande ; null : seul le stock limite. */
    #[ORM\Column(nullable: true)]
    private ?int $equipmentMaxQuantityPerRequest = null;

    #[ORM\Column(type: Types::SMALLINT)]
    private int $equipmentDefaultMaxDays = Materiel::DEFAULT_MAX_CONSECUTIVE_DAYS;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $updatedAt = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(onDelete: 'SET NULL')]
    private ?User $updatedBy = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getRoomOpeningHour(): int
    {
        return $this->roomOpeningHour;
    }

    public function getRoomClosingHour(): int
    {
        return $this->roomClosingHour;
    }

    public function getRoomOneOffMaxDays(): int
    {
        return $this->roomOneOffMaxDays;
    }

    public function updateRooms(int $openingHour, int $closingHour, int $oneOffMaxDays): void
    {
        $this->roomOpeningHour = $openingHour;
        $this->roomClosingHour = $closingHour;
        $this->roomOneOffMaxDays = $oneOffMaxDays;
    }

    public function getEquipmentDeskOpening(): string
    {
        return $this->equipmentDeskOpening;
    }

    public function getEquipmentDeskClosing(): string
    {
        return $this->equipmentDeskClosing;
    }

    public function getEquipmentPickupLocation(): ?string
    {
        return $this->equipmentPickupLocation;
    }

    public function getEquipmentMaxQuantityPerRequest(): ?int
    {
        return $this->equipmentMaxQuantityPerRequest;
    }

    public function getEquipmentDefaultMaxDays(): int
    {
        return $this->equipmentDefaultMaxDays;
    }

    public function updateEquipment(
        string $deskOpening,
        string $deskClosing,
        ?string $pickupLocation,
        ?int $maxQuantityPerRequest,
        int $defaultMaxDays,
    ): void {
        $this->equipmentDeskOpening = $deskOpening;
        $this->equipmentDeskClosing = $deskClosing;
        $this->equipmentPickupLocation = $pickupLocation;
        $this->equipmentMaxQuantityPerRequest = $maxQuantityPerRequest;
        $this->equipmentDefaultMaxDays = $defaultMaxDays;
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
