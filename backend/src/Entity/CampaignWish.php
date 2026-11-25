<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\CampaignWishRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * Vœu récurrent : une salle, un jour de la semaine et une plage horaire demandés pour toute la
 * saison, à une fréquence donnée. La mairie l'attribue ou le refuse pendant l'arbitrage.
 */
#[ORM\Entity(repositoryClass: CampaignWishRepository::class)]
#[ORM\Table(name: 'campaign_wish')]
#[ORM\Index(name: 'idx_campaign_wish_slot', columns: ['salle_id', 'day_of_week'])]
class CampaignWish
{
    public const TYPE_RECURRENT = 'RECURRENT';

    public const STATUS_PENDING = 'En attente d’arbitrage par la mairie';
    public const STATUS_ACCEPTED = 'Attribué';
    public const STATUS_REFUSED = 'Refusé';

    public const FREQUENCIES = [
        'daily' => 'Quotidienne',
        'weekly' => 'Hebdomadaire',
        'biweekly' => 'Bimensuelle (une semaine sur deux)',
        'monthly' => 'Mensuelle',
    ];

    public const AUDIENCES = [
        'youth' => 'Jeunes (moins de 18 ans)',
        'adults' => 'Adultes',
        'seniors' => 'Seniors',
        'all' => 'Tous publics',
        'disability' => 'Public en situation de handicap',
    ];

    public const DAYS = [1 => 'Lundi', 2 => 'Mardi', 3 => 'Mercredi', 4 => 'Jeudi', 5 => 'Vendredi', 6 => 'Samedi', 7 => 'Dimanche'];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: CampaignWishSubmission::class, inversedBy: 'wishes')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?CampaignWishSubmission $submission = null;

    #[ORM\ManyToOne(targetEntity: Salle::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Salle $salle = null;

    /** 1 = lundi … 7 = dimanche (ISO-8601). */
    #[ORM\Column(type: Types::SMALLINT)]
    private int $dayOfWeek;

    /** Premier jour choisi pour la récurrence. */
    #[ORM\Column(type: Types::DATE_IMMUTABLE)]
    private \DateTimeImmutable $startDate;

    /** Heure de début au format HH:mm. */
    #[ORM\Column(length: 5)]
    private string $startTime;

    #[ORM\Column(length: 5)]
    private string $endTime;

    #[ORM\Column(length: 20)]
    private string $frequency;

    #[ORM\Column(length: 120)]
    private string $activity;

    #[ORM\Column(length: 20)]
    private string $audience;

    #[ORM\Column]
    private int $expectedAttendance;

    #[ORM\Column(length: 20)]
    private string $type = self::TYPE_RECURRENT;

    #[ORM\Column(length: 50)]
    private string $status = self::STATUS_PENDING;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $decisionComment = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $decidedAt = null;

    public function __construct(Salle $salle, int $dayOfWeek, \DateTimeImmutable $startDate, string $startTime, string $endTime, string $frequency, string $activity, string $audience, int $expectedAttendance)
    {
        $this->salle = $salle;
        $this->dayOfWeek = $dayOfWeek;
        $this->startDate = $startDate;
        $this->startTime = $startTime;
        $this->endTime = $endTime;
        $this->frequency = $frequency;
        $this->activity = $activity;
        $this->audience = $audience;
        $this->expectedAttendance = $expectedAttendance;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getSubmission(): ?CampaignWishSubmission
    {
        return $this->submission;
    }

    public function setSubmission(CampaignWishSubmission $submission): static
    {
        $this->submission = $submission;

        return $this;
    }

    public function getSalle(): ?Salle
    {
        return $this->salle;
    }

    public function getDayOfWeek(): int
    {
        return $this->dayOfWeek;
    }

    public function getStartDate(): \DateTimeImmutable
    {
        return $this->startDate;
    }

    public function getStartTime(): string
    {
        return $this->startTime;
    }

    public function getEndTime(): string
    {
        return $this->endTime;
    }

    public function getFrequency(): string
    {
        return $this->frequency;
    }

    public function getActivity(): string
    {
        return $this->activity;
    }

    public function getAudience(): string
    {
        return $this->audience;
    }

    public function getExpectedAttendance(): int
    {
        return $this->expectedAttendance;
    }

    public function getType(): string
    {
        return $this->type;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function getDecisionComment(): ?string
    {
        return $this->decisionComment;
    }

    public function getDecidedAt(): ?\DateTimeImmutable
    {
        return $this->decidedAt;
    }

    public function isPending(): bool
    {
        return self::STATUS_PENDING === $this->status;
    }

    public function decide(string $status, ?string $comment): static
    {
        $this->status = $status;
        $this->decisionComment = $comment;
        $this->decidedAt = new \DateTimeImmutable();

        return $this;
    }

    /** Deux vœux se gênent s'ils visent la même salle, le même jour et des horaires qui se chevauchent. */
    public function overlaps(self $other): bool
    {
        return $this->salle?->getId() === $other->getSalle()?->getId()
            && $this->dayOfWeek === $other->getDayOfWeek()
            && $this->startTime < $other->getEndTime()
            && $other->getStartTime() < $this->endTime;
    }
}
