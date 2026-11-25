<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\FaqItemRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: FaqItemRepository::class)]
#[ORM\Table(name: 'faq_item')]
class FaqItem
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private string $question;

    #[ORM\Column(type: Types::TEXT)]
    private string $answer;

    #[ORM\Column(type: Types::INTEGER, options: ['default' => 0])]
    private int $displayOrder = 0;

    public function __construct(string $question = '', string $answer = '', int $displayOrder = 0)
    {
        $this->question = $question;
        $this->answer = $answer;
        $this->displayOrder = $displayOrder;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getQuestion(): string
    {
        return $this->question;
    }

    public function setQuestion(string $question): void
    {
        $this->question = trim($question);
    }

    public function getAnswer(): string
    {
        return $this->answer;
    }

    public function setAnswer(string $answer): void
    {
        $this->answer = trim($answer);
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
