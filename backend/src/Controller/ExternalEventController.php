<?php

namespace App\Controller;

use App\Entity\ExternalEvent;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/events')]
final class ExternalEventController extends AbstractController
{
    private const DEFAULT_STATUS = 'PENDING';

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    #[Route('/external', name: 'api_events_external', methods: ['POST'])]
    #[IsGranted('ROLE_ASSOCIATION')]
    public function create(Request $request): JsonResponse
    {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json(
                ['message' => 'Utilisateur non authentifié.'],
                Response::HTTP_UNAUTHORIZED
            );
        }

        if ($user->getTypeCompte() !== 'association') {
            return $this->json(
                ['message' => 'Accès réservé aux comptes association.'],
                Response::HTTP_FORBIDDEN
            );
        }

        $association = $user->getAssociation();

        if ($association === null || $association->getId() === null) {
            return $this->json(
                ['message' => 'Aucune association associée à cet utilisateur.'],
                Response::HTTP_FORBIDDEN
            );
        }

        $payload = json_decode($request->getContent(), true);

        if (!is_array($payload) || json_last_error() !== JSON_ERROR_NONE) {
            return $this->json(
                ['message' => 'Le corps de la requête est invalide.'],
                Response::HTTP_BAD_REQUEST
            );
        }

        $title = $payload['title'] ?? null;
        $location = $payload['location'] ?? null;
        $eventType = $payload['event_type'] ?? null;
        $startDate = $payload['start_date'] ?? null;
        $endTime = $payload['end_time'] ?? null;

        $errors = [];

        if (!is_string($title) || trim($title) === '') {
            $errors['title'] = 'Le titre est obligatoire.';
        } elseif (mb_strlen($title) > 255) {
            $errors['title'] = 'Le titre ne peut pas dépasser 255 caractères.';
        }

        if (!is_string($location) || trim($location) === '') {
            $errors['location'] = 'Le lieu est obligatoire.';
        } elseif (mb_strlen($location) > 255) {
            $errors['location'] = 'Le lieu ne peut pas dépasser 255 caractères.';
        }

        if (!is_string($eventType) || trim($eventType) === '') {
            $errors['event_type'] = 'Le type d’événement est obligatoire.';
        } elseif (mb_strlen($eventType) > 255) {
            $errors['event_type'] = 'Le type d’événement ne peut pas dépasser 255 caractères.';
        }

        $startDateObject = $this->parseDate($startDate);
        if ($startDateObject === null) {
            $errors['start_date'] = 'La date de début est invalide.';
        }

        $endTimeObject = $this->parseDate($endTime);
        if ($endTimeObject === null) {
            $errors['end_time'] = 'La date de fin est invalide.';
        }

        if (
            $startDateObject !== null
            && $endTimeObject !== null
            && $endTimeObject <= $startDateObject
        ) {
            $errors['end_time'] = 'La date de fin doit être postérieure à la date de début.';
        }

        if ($errors !== []) {
            return $this->json(
                [
                    'message' => 'Les données envoyées sont invalides.',
                    'errors' => $errors,
                ],
                Response::HTTP_UNPROCESSABLE_ENTITY
            );
        }

        $event = new ExternalEvent();
        $event
            ->setAssoId($association->getId())
            ->setTitle(trim($title))
            ->setLocation(trim($location))
            ->setEventType(trim($eventType))
            ->setStartDate($startDateObject)
            ->setEndTime($endTimeObject)
            ->setStatus(self::DEFAULT_STATUS)
            ->setCreatedAt(new \DateTimeImmutable());

        $this->entityManager->persist($event);
        $this->entityManager->flush();

        return $this->json(
            [
                'id' => $event->getId(),
                'asso_id' => $event->getAssoId(),
                'title' => $event->getTitle(),
                'location' => $event->getLocation(),
                'event_type' => $event->getEventType(),
                'start_date' => $event->getStartDate()?->format(\DateTimeInterface::ATOM),
                'end_time' => $event->getEndTime()?->format(\DateTimeInterface::ATOM),
                'status' => $event->getStatus(),
                'created_at' => $event->getCreatedAt()?->format(\DateTimeInterface::ATOM),
            ],
            Response::HTTP_CREATED
        );
    }

    private function parseDate(mixed $value): ?\DateTime
    {
        if (!is_string($value) || trim($value) === '') {
            return null;
        }

        try {
            $date = new \DateTime($value);
        } catch (\Exception) {
            return null;
        }

        $errors = \DateTime::getLastErrors();
        if ($errors !== false && ($errors['warning_count'] > 0 || $errors['error_count'] > 0)) {
            return null;
        }

        return $date;
    }
}