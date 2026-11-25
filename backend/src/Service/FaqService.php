<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\FaqItem;
use App\Exception\SettingsValidationException;
use App\Repository\FaqItemRepository;
use Doctrine\ORM\EntityManagerInterface;

final class FaqService
{
    public const DEFAULT_FAQ = [
        [
            'question' => 'Qui peut créer un compte ?',
            'answer' => 'Les associations de Feytiat, via leur président ou un membre du bureau. Les particuliers passent par le site de la ville.',
            'displayOrder' => 1,
        ],
        [
            'question' => 'Quand mon compte est-il actif ?',
            'answer' => 'Dès que la mairie a vérifié l’inscription. Un e-mail vous invite alors à choisir votre mot de passe.',
            'displayOrder' => 2,
        ],
        [
            'question' => 'Puis-je finir une demande plus tard ?',
            'answer' => 'Oui, elle reste en brouillon jusqu’à ce que vous la transmettiez.',
            'displayOrder' => 3,
        ],
        [
            'question' => 'Comment suivre mes demandes ?',
            'answer' => 'Chaque demande affiche son statut dans votre espace, et un e-mail vous prévient à chaque décision.',
            'displayOrder' => 4,
        ],
    ];

    public function __construct(
        private readonly FaqItemRepository $repository,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    /**
     * @return list<array{id: int, question: string, answer: string, displayOrder: int}>
     */
    public function listAll(): array
    {
        $items = $this->repository->findAllOrdered();
        if ($items === []) {
            $this->seedDefaultFaq();
            $items = $this->repository->findAllOrdered();
        }

        return array_map($this->serialize(...), $items);
    }

    public function create(?string $question, ?string $answer, int $displayOrder = 0): FaqItem
    {
        $cleanQuestion = trim((string) $question);
        $cleanAnswer = trim((string) $answer);
        $errors = [];
        if ($cleanQuestion === '') {
            $errors['question'] = 'La question est obligatoire.';
        }
        if ($cleanAnswer === '') {
            $errors['answer'] = 'La réponse est obligatoire.';
        }
        if ($errors !== []) {
            throw new SettingsValidationException($errors);
        }

        $item = new FaqItem($cleanQuestion, $cleanAnswer, $displayOrder);
        $this->entityManager->persist($item);
        $this->entityManager->flush();

        return $item;
    }

    public function update(FaqItem $item, ?string $question, ?string $answer, ?int $displayOrder): FaqItem
    {
        if ($question !== null) {
            $clean = trim($question);
            if ($clean === '') {
                throw new SettingsValidationException(['question' => 'La question ne peut pas être vide.']);
            }
            $item->setQuestion($clean);
        }
        if ($answer !== null) {
            $clean = trim($answer);
            if ($clean === '') {
                throw new SettingsValidationException(['answer' => 'La réponse ne peut pas être vide.']);
            }
            $item->setAnswer($clean);
        }
        if ($displayOrder !== null) {
            $item->setDisplayOrder($displayOrder);
        }

        $this->entityManager->flush();

        return $item;
    }

    public function delete(FaqItem $item): void
    {
        $this->entityManager->remove($item);
        $this->entityManager->flush();
    }

    /**
     * @return array{id: int, question: string, answer: string, displayOrder: int}
     */
    public function serialize(FaqItem $item): array
    {
        return [
            'id' => (int) $item->getId(),
            'question' => $item->getQuestion(),
            'answer' => $item->getAnswer(),
            'displayOrder' => $item->getDisplayOrder(),
        ];
    }

    private function seedDefaultFaq(): void
    {
        foreach (self::DEFAULT_FAQ as $data) {
            $item = new FaqItem($data['question'], $data['answer'], (int) $data['displayOrder']);
            $this->entityManager->persist($item);
        }
        $this->entityManager->flush();
    }
}
