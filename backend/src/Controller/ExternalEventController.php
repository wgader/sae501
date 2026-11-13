<?php

namespace App\Controller;

use App\Entity\ExternalEvent;
use App\Entity\ExternalEventFile;
use App\Entity\User;
use App\Repository\AssociationRepository;
use App\Repository\ExternalEventFileRepository;
use App\Repository\ExternalEventRepository;
use App\Repository\UserRepository;
use App\Service\SecureEventFileStorage;
use App\Service\NotificationService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/events')]
final class ExternalEventController extends AbstractController
{
    private const DEFAULT_STATUS = 'PENDING';

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly AssociationRepository $associationRepository,
        private readonly ExternalEventRepository $eventRepository,
        private readonly UserRepository $userRepository,
        private readonly ExternalEventFileRepository $eventFileRepository,
        private readonly SecureEventFileStorage $fileStorage,
        private readonly MailerInterface $mailer,
        private readonly NotificationService $notificationService,
        #[Autowire(env: 'MAILER_FROM')] private readonly string $mailerFrom,
        #[Autowire(env: 'FRONTEND_URL')] private readonly string $frontendUrl,
    ) {
    }

    #[Route('', name: 'api_events_external_list', methods: ['GET'])]
    #[Route('/external', name: 'api_events_external_list_legacy', methods: ['GET'])]
    #[IsGranted(new \Symfony\Component\ExpressionLanguage\Expression("is_granted('ROLE_ADMIN') or (is_granted('ROLE_MAIRIE') and is_granted('ROLE_GESTION_EVENT'))"))]
    public function list(Request $request): JsonResponse
    {
        $page = max(1, $request->query->getInt('page', 1));
        $itemsPerPage = min(50, max(1, $request->query->getInt('itemsPerPage', 10)));

        return $this->json([
            'items' => array_map(
                fn (ExternalEvent $event): array => $this->serializeEvent($event),
                $this->eventRepository->findForAdministration($page, $itemsPerPage),
            ),
            'page' => $page,
            'itemsPerPage' => $itemsPerPage,
            'totalItems' => $this->eventRepository->countForAdministration(),
        ]);
    }

    #[Route('/{id<\d+>}', name: 'api_events_external_show', methods: ['GET'])]
    #[Route('/external/{id<\d+>}', name: 'api_events_external_show_legacy', methods: ['GET'])]
    #[IsGranted(new \Symfony\Component\ExpressionLanguage\Expression("is_granted('ROLE_ADMIN') or (is_granted('ROLE_MAIRIE') and is_granted('ROLE_GESTION_EVENT'))"))]
    public function show(int $id): JsonResponse
    {
        $event = $this->eventRepository->find($id);
        if (!$event instanceof ExternalEvent) {
            return $this->json(['message' => 'Événement introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $data = $this->serializeEvent($event);
        $data['files'] = array_map(
            static fn (ExternalEventFile $file): array => self::serializeFile($file),
            $this->eventFileRepository->findForEvent($id),
        );

        return $this->json($data);
    }

    #[Route('/{id<\d+>}/status', name: 'api_events_external_status', methods: ['PATCH'])]
    #[Route('/external/{id<\d+>}/status', name: 'api_events_external_status_legacy', methods: ['PATCH'])]
    #[IsGranted(new \Symfony\Component\ExpressionLanguage\Expression("is_granted('ROLE_ADMIN') or (is_granted('ROLE_MAIRIE') and is_granted('ROLE_GESTION_EVENT'))"))]
    public function updateStatus(int $id, Request $request): JsonResponse
    {
        $event = $this->eventRepository->find($id);
        if (!$event instanceof ExternalEvent) {
            return $this->json(['message' => 'Événement introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $payload = json_decode($request->getContent(), true);
        $status = is_array($payload) ? ($payload['status'] ?? null) : null;

        if ($status !== 'VALIDATED') {
            return $this->json(
                ['message' => 'Le statut demandé est invalide.'],
                Response::HTTP_UNPROCESSABLE_ENTITY
            );
        }

        $event->setStatus($status);
        $this->entityManager->flush();

        return $this->json($this->serializeEvent($event));
    }

    #[Route('/files/{id<\d+>}', name: 'api_events_external_file_download', methods: ['GET'])]
    #[Route('/external/files/{id<\d+>}', name: 'api_events_external_file_download_legacy', methods: ['GET'])]
    #[IsGranted(new \Symfony\Component\ExpressionLanguage\Expression("is_granted('ROLE_ADMIN') or (is_granted('ROLE_MAIRIE') and is_granted('ROLE_GESTION_EVENT'))"))]
    public function downloadFile(int $id): BinaryFileResponse|JsonResponse
    {
        $file = $this->eventFileRepository->find($id);
        if (!$file instanceof ExternalEventFile) {
            return $this->json(['message' => 'Fichier introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $absolutePath = $this->fileStorage->resolve($file->getFilePath() ?? '');
        if ($absolutePath === null) {
            return $this->json(
                ['message' => 'Fichier introuvable sur le serveur.'],
                Response::HTTP_NOT_FOUND
            );
        }

        $response = new BinaryFileResponse($absolutePath);
        $response->headers->set(
            'Content-Type',
            $file->getMimeType() ?? 'application/octet-stream'
        );
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->setContentDisposition(
            ResponseHeaderBag::DISPOSITION_ATTACHMENT,
            $file->getOriginalName() ?? 'download'
        );

        return $response;
    }

    #[Route('/association/files/{id<\d+>}', name: 'api_events_association_file_download', methods: ['GET'])]
    #[IsGranted('ROLE_ASSOCIATION')]
    public function downloadAssociationFile(int $id): BinaryFileResponse|JsonResponse
    {
        $user = $this->getUser();
        $association = $user instanceof User ? $user->getAssociation() : null;
        $file = $this->eventFileRepository->find($id);

        if ($association === null || !$file instanceof ExternalEventFile) {
            return $this->json(['message' => 'Fichier introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $event = $this->eventRepository->find($file->getEventId());
        if (!$event instanceof ExternalEvent || $event->getAssoId() !== $association->getId()) {
            return $this->json(['message' => 'Fichier introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $absolutePath = $this->fileStorage->resolve($file->getFilePath() ?? '');
        if ($absolutePath === null) {
            return $this->json(
                ['message' => 'Fichier introuvable sur le serveur.'],
                Response::HTTP_NOT_FOUND
            );
        }

        $response = new BinaryFileResponse($absolutePath);
        $response->headers->set('Content-Type', $file->getMimeType() ?? 'application/octet-stream');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->setContentDisposition(
            ResponseHeaderBag::DISPOSITION_ATTACHMENT,
            $file->getOriginalName() ?? 'download'
        );

        return $response;
    }

    #[Route('/external', name: 'api_events_external_create', methods: ['POST'])]
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

    #[Route('/external/{id<\d+>}/request-files', name: 'api_events_request_files', methods: ['POST'])]
    #[IsGranted('ROLE_GESTION_EVENT')]
    public function requestFiles(int $id, Request $request): JsonResponse
    {
        $event = $this->eventRepository->find($id);
        if (!$event instanceof ExternalEvent) {
            return $this->json(['message' => 'Événement introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $payload = json_decode($request->getContent(), true);
        if (!is_array($payload)) {
            return $this->json(
                ['message' => 'Le corps de la requête est invalide.'],
                Response::HTTP_BAD_REQUEST
            );
        }

        $missingFiles = $payload['missing_files'] ?? null;
        $message = $payload['message'] ?? null;
        $errors = [];

        if (!is_array($missingFiles) || $missingFiles === []) {
            $errors['missing_files'] = 'Au moins une pièce manquante doit être indiquée.';
        } else {
            foreach ($missingFiles as $index => $missingFile) {
                if (!is_string($missingFile) || trim($missingFile) === '') {
                    $errors['missing_files.' . $index] = 'Le nom de la pièce doit être renseigné.';
                } elseif (mb_strlen($missingFile) > 255) {
                    $errors['missing_files.' . $index] = 'Le nom de la pièce ne peut pas dépasser 255 caractères.';
                }
            }
        }

        if (!is_string($message) || trim($message) === '') {
            $errors['message'] = 'Le message de relance est obligatoire.';
        } elseif (mb_strlen($message) > 2000) {
            $errors['message'] = 'Le message ne peut pas dépasser 2000 caractères.';
        }

        if ($errors !== []) {
            return $this->json(
                ['message' => 'Les données envoyées sont invalides.', 'errors' => $errors],
                Response::HTTP_UNPROCESSABLE_ENTITY
            );
        }

        $association = $this->associationRepository->find($event->getAssoId());
        if ($association === null) {
            return $this->json(
                ['message' => 'Association liée à l’événement introuvable.'],
                Response::HTTP_NOT_FOUND
            );
        }

        $normalizedMissingFiles = array_values(array_map(
            static fn (string $missingFile): string => trim($missingFile),
            $missingFiles
        ));
        $normalizedMessage = trim($message);

        $event
            ->setStatus('WAITING_DOCUMENTS')
            ->setMissingFiles($normalizedMissingFiles)
            ->setDocumentsRequestMessage($normalizedMessage)
            ->setDocumentsRequestedAt(new \DateTimeImmutable());
        $this->entityManager->flush();

        foreach ($association->getUsers() as $user) {
            $this->notificationService->createForUser(
                $user,
                'Pièces complémentaires demandées',
                $normalizedMessage,
                'EVENT_FILES_REQUESTED',
                $event->getId(),
            );
        }
        // Persist notifications before sending email: an SMTP failure must not
        // prevent the business event (the notification) from being recorded.
        $this->entityManager->flush();

        foreach ($association->getUsers() as $user) {
            $email = $user->getEmail();
            if ($email === null) {
                continue;
            }

            $this->mailer->send(
                (new TemplatedEmail())
                    ->from(new Address($this->mailerFrom, 'Mairie de Feytiat'))
                    ->to($email)
                    ->subject('Pièces complémentaires demandées pour votre événement')
                    ->htmlTemplate('emails/event_files_requested.html.twig')
                    ->context([
                        'prenom' => $user->getPrenom(),
                        'nomAssociation' => $association->getNom(),
                        'eventTitle' => $event->getTitle(),
                        'missingFiles' => $normalizedMissingFiles,
                        'message' => $normalizedMessage,
                        'documentsUrl' => rtrim($this->frontendUrl, '/')
                            . '/historique/event-' . $event->getId()
                            . '/pieces-annexes?type=evenement',
                    ]),
            );
        }

        return $this->json([
            'message' => 'La demande de pièces complémentaires a été envoyée.',
            'event_id' => $event->getId(),
            'status' => $event->getStatus(),
            'missing_files' => $normalizedMissingFiles,
        ]);
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
    #[Route('/{id<\d+>}/files', name: 'api_events_file_upload', methods: ['POST'])]
    #[Route('/external/{id<\d+>}/files', name: 'api_events_file_upload_legacy', methods: ['POST'])]
    #[IsGranted('ROLE_ASSOCIATION')]
    public function uploadFile(int $id, Request $request): JsonResponse
    {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['message' => 'Utilisateur non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        if ($user->getTypeCompte() !== 'association') {
            return $this->json(['message' => 'Accès réservé aux comptes association.'], Response::HTTP_FORBIDDEN);
        }

        $association = $user->getAssociation();
        $event = $this->eventRepository->find($id);
        if ($association === null || $event === null || $event->getAssoId() !== $association->getId()) {
            return $this->json(['message' => 'Événement introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $file = $request->files->get('file');
        if (!$file instanceof UploadedFile) {
            return $this->json(['message' => 'Le champ "file" est obligatoire.'], Response::HTTP_BAD_REQUEST);
        }

        try {
            $storedFile = $this->fileStorage->store($file);
        } catch (\InvalidArgumentException $exception) {
            return $this->json(['message' => $exception->getMessage()], Response::HTTP_UNPROCESSABLE_ENTITY);
        } catch (\RuntimeException $exception) {
            return $this->json(['message' => $exception->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        $eventFile = (new ExternalEventFile())
            ->setEventId($id)
            ->setFilePath($storedFile['path'])
            ->setFileType($storedFile['extension'])
            ->setOriginalName($storedFile['originalName'])
            ->setMimeType($storedFile['mimeType'])
            ->setFileSize($storedFile['size'])
            ->setSha256($storedFile['sha256']);

        $this->entityManager->persist($eventFile);
        foreach ($this->userRepository->findEventNotificationRecipients() as $recipient) {
            $this->notificationService->createForUser(
                $recipient,
                'Nouvelle pièce déposée',
                sprintf(
                    'Une nouvelle pièce (%s) a été déposée pour l’événement « %s ».',
                    $eventFile->getOriginalName(),
                    $event->getTitle(),
                ),
                'EVENT_FILE_UPLOADED',
                $event->getId(),
            );
        }
        $this->entityManager->flush();

        return $this->json([
            'id' => $eventFile->getId(),
            'event_id' => $eventFile->getEventId(),
            'original_name' => $eventFile->getOriginalName(),
            'file_type' => $eventFile->getFileType(),
            'mime_type' => $eventFile->getMimeType(),
            'file_size' => $eventFile->getFileSize(),
            'sha256' => $eventFile->getSha256(),
        ], Response::HTTP_CREATED);
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeEvent(ExternalEvent $event): array
    {
        $association = $this->associationRepository->find($event->getAssoId());

        return [
            'id' => $event->getId(),
            'asso_id' => $event->getAssoId(),
            'association_name' => $association?->getNom(),
            'title' => $event->getTitle(),
            'location' => $event->getLocation(),
            'event_type' => $event->getEventType(),
            'start_date' => $event->getStartDate()?->format(\DateTimeInterface::ATOM),
            'end_time' => $event->getEndTime()?->format(\DateTimeInterface::ATOM),
            'status' => $event->getStatus(),
            'missing_files' => $event->getMissingFiles() ?? [],
            'documents_request_message' => $event->getDocumentsRequestMessage(),
            'documents_requested_at' => $event->getDocumentsRequestedAt()?->format(\DateTimeInterface::ATOM),
            'created_at' => $event->getCreatedAt()?->format(\DateTimeInterface::ATOM),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private static function serializeFile(ExternalEventFile $file): array
    {
        return [
            'id' => $file->getId(),
            'original_name' => $file->getOriginalName(),
            'file_type' => $file->getFileType(),
            'mime_type' => $file->getMimeType(),
            'file_size' => $file->getFileSize(),
            'sha256' => $file->getSha256(),
        ];
    }

}