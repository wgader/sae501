<?php

namespace App\Controller;

use App\Entity\DocumentJustificatif;
use App\Entity\User;
use App\Repository\ReservationMaterielRepository;
use App\Repository\ReservationSalleRepository;
use App\Service\AssociationRequestAggregationService;
use App\Service\AssociationRequestCancellationService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/association/requests')]
final class AssociationRequestController extends AbstractController
{
    public function __construct(
        private readonly AssociationRequestAggregationService $aggregationService,
        private readonly AssociationRequestCancellationService $cancellationService,
        private readonly EntityManagerInterface $entityManager,
        private readonly ReservationMaterielRepository $materielRepository,
        private readonly ReservationSalleRepository $salleRepository,
        #[Autowire('%kernel.project_dir%')] private readonly string $projectDir,
    ) {
    }

    #[Route('', name: 'app_association_requests_list', methods: ['GET'])]
    public function list(Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) {
            return $this->json(
                ['message' => 'Authentification requise pour accéder aux démarches.'],
                Response::HTTP_UNAUTHORIZED,
            );
        }

        $association = $user->getAssociation();
        if ($association === null) {
            return $this->json(
                ['message' => "Votre compte n'est rattaché à aucune association."],
                Response::HTTP_FORBIDDEN,
            );
        }

        $filters = [
            'status' => $request->query->get('status'),
            'type' => $request->query->get('type'),
            'year' => $request->query->get('year'),
            'search' => $request->query->get('search'),
            'page' => $request->query->getInt('page', 1),
            'limit' => $request->query->getInt('limit', 10),
        ];

        $data = $this->aggregationService->getConsolidatedRequests($association, $filters);

        return $this->json($data);
    }

    #[Route('/{id}', name: 'app_association_requests_show', methods: ['GET'])]
    public function show(string $id, Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) {
            return $this->json(
                ['message' => 'Authentification requise pour accéder à cette démarche.'],
                Response::HTTP_UNAUTHORIZED,
            );
        }

        $association = $user->getAssociation();
        if ($association === null) {
            return $this->json(
                ['message' => "Votre compte n'est rattaché à aucune association."],
                Response::HTTP_FORBIDDEN,
            );
        }

        try {
            $type = $request->query->get('type');
            $detail = $this->aggregationService->getRequestDetail($association, $id, is_string($type) ? $type : null);

            if ($detail === null) {
                return $this->json(
                    ['message' => 'Dossier introuvable.'],
                    Response::HTTP_NOT_FOUND,
                );
            }

            return $this->json($detail);
        } catch (AccessDeniedException $e) {
            return $this->json(
                ['message' => $e->getMessage()],
                Response::HTTP_FORBIDDEN,
            );
        }
    }

    #[Route('/{id}/documents', name: 'app_association_request_document_create', methods: ['POST'])]
    public function addDocument(string $id, Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) {
            return $this->json(
                ['message' => 'Authentification requise pour déposer une pièce.'],
                Response::HTTP_UNAUTHORIZED,
            );
        }

        $association = $user->getAssociation();
        if ($association === null) {
            return $this->json(
                ['message' => "Votre compte n'est rattaché à aucune association."],
                Response::HTTP_FORBIDDEN,
            );
        }

        $type = $request->request->get('type');
        if (!is_string($type) || !in_array($type, [
            AssociationRequestAggregationService::TYPE_MATERIEL,
            AssociationRequestAggregationService::TYPE_SALLE,
        ], true)) {
            return $this->json(['message' => 'Le type de réservation est invalide.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $requestId = (int) preg_replace('/\D/', '', $id);
        $reservation = $type === AssociationRequestAggregationService::TYPE_MATERIEL
            ? $this->materielRepository->find($requestId)
            : $this->salleRepository->find($requestId);

        if ($reservation === null || $reservation->getAssociation()?->getId() !== $association->getId()) {
            return $this->json(['message' => 'Dossier introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $file = $request->files->get('file');
        if (!$file instanceof UploadedFile || !$file->isValid()) {
            return $this->json(['message' => 'Fichier invalide ou manquant.'], Response::HTTP_BAD_REQUEST);
        }

        if ($file->getSize() === false || $file->getSize() > 10 * 1024 * 1024) {
            return $this->json(['message' => 'Le fichier ne doit pas dépasser 10 Mo.'], Response::HTTP_BAD_REQUEST);
        }

        $mimeType = $file->getMimeType();
        $allowedTypes = [
            'application/pdf' => 'pdf',
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
        ];
        if (!is_string($mimeType) || !isset($allowedTypes[$mimeType])) {
            return $this->json(
                ['message' => 'Seuls les formats PDF, JPEG, PNG et WebP sont autorisés.'],
                Response::HTTP_UNPROCESSABLE_ENTITY,
            );
        }

        $directory = $this->projectDir . '/public/uploads/documents';
        if (!is_dir($directory) && !mkdir($directory, 0755, true) && !is_dir($directory)) {
            return $this->json(
                ['message' => 'Impossible de préparer le répertoire de stockage.'],
                Response::HTTP_INTERNAL_SERVER_ERROR,
            );
        }

        $originalName = $file->getClientOriginalName();
        $fileSize = $file->getSize() ?: 0;
        $typeDocument = trim((string) $request->request->get('typeDocument', $originalName));
        if ($typeDocument === '') {
            $typeDocument = $originalName;
        }
        if (mb_strlen($typeDocument) > 100) {
            return $this->json(
                ['message' => 'Le nom du document ne peut pas dépasser 100 caractères.'],
                Response::HTTP_UNPROCESSABLE_ENTITY,
            );
        }
        $filename = bin2hex(random_bytes(24)) . '.' . $allowedTypes[$mimeType];
        $file->move($directory, $filename);

        $document = new DocumentJustificatif();
        $document
            ->setAssociation($association)
            ->setTypeDocument($typeDocument)
            ->setFichierUrl('/uploads/documents/' . $filename)
            ->setLieAType($type)
            ->setLieAId($requestId)
            ->setDescription(json_encode([
                'verified' => false,
                'size' => $fileSize,
                'originalName' => $originalName,
                'mimeType' => $mimeType,
            ], JSON_THROW_ON_ERROR));

        $this->entityManager->persist($document);
        $this->entityManager->flush();

        return $this->json($this->serializeDocument($document), Response::HTTP_CREATED);
    }

    #[Route('/{id}/cancel', name: 'app_association_requests_cancel', methods: ['POST'])]
    public function cancel(string $id, Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) {
            return $this->json(
                ['message' => 'Authentification requise pour annuler une réservation.'],
                Response::HTTP_UNAUTHORIZED,
            );
        }

        $association = $user->getAssociation();
        if ($association === null) {
            return $this->json(
                ['message' => "Votre compte n'est rattaché à aucune association."],
                Response::HTTP_FORBIDDEN,
            );
        }

        $payload = json_decode($request->getContent(), true);
        $type = is_array($payload) && is_string($payload['type'] ?? null)
            ? $payload['type']
            : $request->query->get('type');

        if (!is_string($type) || !in_array($type, [
            AssociationRequestAggregationService::TYPE_MATERIEL,
            AssociationRequestAggregationService::TYPE_SALLE,
        ], true)) {
            return $this->json(
                ['message' => 'Le type de réservation est invalide.'],
                Response::HTTP_UNPROCESSABLE_ENTITY,
            );
        }

        try {
            $reservation = $this->cancellationService->cancel(
                $association,
                $type,
                (int) preg_replace('/\D/', '', $id),
            );

            return $this->json([
                'id' => $id,
                'type' => $type,
                'statut' => $reservation->getStatut(),
                'updatedAt' => $reservation->getUpdatedAt()?->format(\DateTimeInterface::ATOM),
            ]);
        } catch (\OutOfBoundsException $exception) {
            return $this->json(['message' => $exception->getMessage()], Response::HTTP_NOT_FOUND);
        } catch (\DomainException $exception) {
            return $this->json(['message' => $exception->getMessage()], Response::HTTP_UNPROCESSABLE_ENTITY);
        } catch (\LogicException $exception) {
            return $this->json(['message' => $exception->getMessage()], Response::HTTP_FORBIDDEN);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private static function serializeDocument(DocumentJustificatif $document): array
    {
        $metadata = json_decode($document->getDescription() ?? '', true);
        $metadata = is_array($metadata) ? $metadata : [];

        return [
            'id' => $document->getId(),
            'typeDocument' => $document->getTypeDocument(),
            'fichierUrl' => $document->getFichierUrl(),
            'isVerified' => (bool) ($metadata['verified'] ?? false),
            'size' => (int) ($metadata['size'] ?? 0),
            'originalName' => $metadata['originalName'] ?? $document->getTypeDocument(),
            'mimeType' => $metadata['mimeType'] ?? 'application/pdf',
            'createdAt' => $document->getCreatedAt()?->format(\DateTimeInterface::ATOM),
        ];
    }
}
