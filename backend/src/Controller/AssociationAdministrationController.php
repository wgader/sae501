<?php

namespace App\Controller;

use App\Entity\Association;
use App\Entity\ReservationMateriel;
use App\Entity\ReservationSalle;
use App\Repository\AssociationRepository;
use App\Repository\ReservationMaterielRepository;
use App\Repository\ReservationSalleRepository;
use App\Repository\ExternalEventRepository;
use App\Entity\ExternalEvent;
use App\Service\AssociationStatusNotifier;
use App\Service\AssociationRequestAggregationService;
use App\Service\AssociationRequestDocumentsNotifier;
use App\Service\PrivateDocumentStorage;
use App\Entity\DocumentJustificatif;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;


#[Route('/api/admin/associations')]
#[IsGranted('ROLE_MAIRIE')]
final class AssociationAdministrationController extends AbstractController
{
    private const STATUSES = ['PENDING_VALIDATION', 'VALIDATED', 'REFUSED', 'SUSPENDED'];
    private const MODULES = ['subventions', 'materiel', 'salles', 'evenements'];

    public function __construct(
        private readonly AssociationRepository $associationRepository,
        private readonly ReservationMaterielRepository $materielRepository,
        private readonly ReservationSalleRepository $salleRepository,
        private readonly ExternalEventRepository $eventRepository,
        private readonly EntityManagerInterface $entityManager,
        private readonly AssociationStatusNotifier $statusNotifier,
        private readonly AssociationRequestAggregationService $requestAggregationService,
        private readonly AssociationRequestDocumentsNotifier $requestDocumentsNotifier,
        private readonly PrivateDocumentStorage $documentStorage,
    ) {
    }

    #[Route('', name: 'admin_associations_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        try {
            $page = max(1, $request->query->getInt('page', 1));
            $itemsPerPage = min(50, max(1, $request->query->getInt('itemsPerPage', 10)));
            $status = $request->query->get('status');
            if ($status === '') {
                $status = null;
            }

            if ($status !== null && !in_array($status, self::STATUSES, true)) {
                return $this->json(['message' => 'Le statut demandé est invalide.'], Response::HTTP_BAD_REQUEST);
            }

            $search = $request->query->get('q');
            if (is_string($search) && trim($search) === '') {
                $search = null;
            }

            $totalItems = $this->associationRepository->countForAdministration($status, $search);
            $counts = $this->associationRepository->getCountsForAdministration();
            $items = array_map(
                static fn (Association $association): array => self::serializeAssociation($association),
                $this->associationRepository->findForAdministration($status, $page, $itemsPerPage, $search),
            );

            return $this->json([
                'items' => $items,
                'page' => $page,
                'itemsPerPage' => $itemsPerPage,
                'totalItems' => $totalItems,
                'counts' => $counts,
            ]);
        } catch (\Throwable $e) {
            return $this->json(['message' => 'Impossible de récupérer la liste des associations.'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/{id<\d+>}', name: 'admin_association_show', methods: ['GET'])]
    public function show(int $id): JsonResponse
    {
        $association = $this->associationRepository->find($id);
        if (!$association) {
            return $this->json(['message' => 'Association introuvable.'], Response::HTTP_NOT_FOUND);
        }

        return $this->json(self::serializeAssociation($association));
    }

    #[Route('/{id<\d+>}/requests', name: 'admin_association_requests', methods: ['GET'])]
    public function requests(int $id): JsonResponse
    {
        $association = $this->associationRepository->find($id);
        if (!$association) {
            return $this->json(['message' => 'Association introuvable.'], Response::HTTP_NOT_FOUND);
        }

        return $this->json($this->requestAggregationService->getConsolidatedRequests($association, [
            'limit' => 100,
            'page' => 1,
        ]));
    }

    #[Route('/{id<\d+>}/events', name: 'admin_association_events', methods: ['GET'])]
    public function events(int $id): JsonResponse
    {
        if (!$this->associationRepository->find($id)) {
            return $this->json(['message' => 'Association introuvable.'], Response::HTTP_NOT_FOUND);
        }

        return $this->json([
            'items' => array_map(
                static fn (ExternalEvent $event): array => [
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
                $this->eventRepository->findByAssociation($id),
            ),
        ]);
    }

    #[Route('/{id<\d+>}/requests/{requestId}', name: 'admin_association_request_show', methods: ['GET'])]
    public function requestDetail(int $id, string $requestId, Request $request): JsonResponse
    {
        $association = $this->associationRepository->find($id);
        if (!$association) {
            return $this->json(['message' => 'Association introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $type = $request->query->get('type');
        $detail = $this->requestAggregationService->getRequestDetail(
            $association,
            $requestId,
            is_string($type) ? $type : null,
        );

        if ($detail === null) {
            return $this->json(['message' => 'Dossier introuvable.'], Response::HTTP_NOT_FOUND);
        }

        return $this->json($detail);
    }

    #[Route('/{id<\d+>}/requests/{requestId}/request-documents', name: 'admin_association_request_documents_request', methods: ['POST'])]
    public function requestDocuments(int $id, string $requestId, Request $request): JsonResponse
    {
        $association = $this->associationRepository->find($id);
        if (!$association) {
            return $this->json(['message' => 'Association introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $payload = json_decode($request->getContent(), true);
        if (!is_array($payload)) {
            return $this->json(['message' => 'Le corps de la requête est invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $type = $payload['type'] ?? null;
        $message = isset($payload['message']) && is_string($payload['message']) ? trim($payload['message']) : '';
        $missingFiles = $payload['missingFiles'] ?? null;
        if (!is_string($type) || !in_array($type, ['materiel', 'salle'], true)) {
            return $this->json(['message' => 'Le type de demande est invalide.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }
        if ($message === '' || mb_strlen($message) > 2000) {
            return $this->json(['message' => 'Le message est obligatoire et limité à 2000 caractères.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }
        if (!is_array($missingFiles) || $missingFiles === []) {
            return $this->json(['message' => 'Au moins une pièce manquante doit être indiquée.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $normalizedFiles = [];
        foreach ($missingFiles as $missingFile) {
            if (!is_string($missingFile) || trim($missingFile) === '') {
                return $this->json(['message' => 'Chaque pièce manquante doit être renseignée.'], Response::HTTP_UNPROCESSABLE_ENTITY);
            }
            $normalizedFiles[] = mb_substr(trim($missingFile), 0, 150);
        }

        $numericId = (int) preg_replace('/\D/', '', $requestId);
        $reservation = $type === 'materiel'
            ? $this->materielRepository->find($numericId)
            : $this->salleRepository->find($numericId);
        if (!$reservation || $reservation->getAssociation()?->getId() !== $association->getId()) {
            return $this->json(['message' => 'Dossier introuvable.'], Response::HTTP_NOT_FOUND);
        }

        if (!in_array($reservation->getStatut(), ['En attente', 'En cours de traitement', 'Complément requis', 'Validée'], true)) {
            return $this->json(['message' => 'Une demande clôturée ne peut plus faire l’objet d’une relance.'], Response::HTTP_CONFLICT);
        }

        $reservation
            ->setStatut('Complément requis')
            ->setObservations($message)
            ->setUpdatedAt(new \DateTimeImmutable());
        $this->entityManager->flush();
        $this->requestDocumentsNotifier->notify($reservation, $normalizedFiles, $message);
        $this->entityManager->flush();

        $detail = $this->requestAggregationService->getRequestDetail($association, $requestId, $type);

        return $this->json([
            'message' => 'La demande de pièces a été enregistrée.',
            'missingFiles' => $normalizedFiles,
            'detail' => $detail,
        ]);
    }

    #[Route('/{id<\d+>}/status', name: 'admin_association_status', methods: ['PATCH'])]
    public function updateStatus(int $id, Request $request): JsonResponse
    {
        $association = $this->associationRepository->find($id);
        if (!$association) {
            return $this->json(['message' => 'Association introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $payload = json_decode($request->getContent(), true);
        if (!is_array($payload)) {
            return $this->json(['message' => 'Le corps de la requête est invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $status = $payload['status'] ?? null;
        if ($status !== null && (!is_string($status) || !in_array($status, self::STATUSES, true))) {
            return $this->json(['message' => 'Le statut demandé est invalide.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $permissions = $payload['permissions'] ?? null;
        if ($permissions !== null) {
            if (!is_array($permissions)) {
                return $this->json(['message' => 'Les permissions doivent être un tableau.'], Response::HTTP_UNPROCESSABLE_ENTITY);
            }

            $invalidModules = array_diff($permissions, self::MODULES);
            if (!empty($invalidModules)) {
                return $this->json(['message' => 'Un ou plusieurs modules sont invalides.'], Response::HTTP_UNPROCESSABLE_ENTITY);
            }
        }

        try {
            $previousStatus = $association->getStatut();

            if ($status !== null) {
                $association->setStatut($status);
            }

            if ($permissions !== null) {
                $association->setModuleSubventionActif(in_array('subventions', $permissions, true));
                $association->setModuleMaterielActif(in_array('materiel', $permissions, true));
                $association->setModuleSalleActif(in_array('salles', $permissions, true));
                $association->setModuleEvenementActif(in_array('evenements', $permissions, true));
            }

            $this->entityManager->persist($association);
            $this->entityManager->flush();

            $needsActivationEmail = $status === 'VALIDATED'
                && (
                    $previousStatus !== $status
                    || $association->getUsers()->exists(
                        static fn (int $_index, \App\Entity\User $user): bool => !$user->isVerified() && $user->getActivationToken() === null
                    )
                );
            if ($needsActivationEmail) {
                $this->statusNotifier->notify($association, $status);
            }

            return $this->json(self::serializeAssociation($association));
        } catch (\Throwable $e) {
            return $this->json(['message' => 'Erreur lors de la mise à jour du statut.'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/{id<\d+>}/modules', name: 'admin_association_modules', methods: ['PATCH'])]
    public function updateModules(int $id, Request $request): JsonResponse
    {
        $association = $this->associationRepository->find($id);
        if (!$association) {
            return $this->json(['message' => 'Association introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $payload = json_decode($request->getContent(), true);
        if (!is_array($payload)) {
            return $this->json(['message' => 'Le corps de la requête est invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $permissions = $payload['permissions'] ?? null;
        if (!is_array($permissions)) {
            return $this->json(['message' => 'Les permissions doivent être un tableau.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $invalidModules = array_diff($permissions, self::MODULES);
        if (!empty($invalidModules)) {
            return $this->json(['message' => 'Un ou plusieurs modules sont invalides.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        try {
            $association->setModuleSubventionActif(in_array('subventions', $permissions, true));
            $association->setModuleMaterielActif(in_array('materiel', $permissions, true));
            $association->setModuleSalleActif(in_array('salles', $permissions, true));
            $association->setModuleEvenementActif(in_array('evenements', $permissions, true));

            $this->entityManager->persist($association);
            $this->entityManager->flush();

            return $this->json(self::serializeAssociation($association));
        } catch (\Throwable $e) {
            return $this->json(['message' => 'Erreur lors de la mise à jour des modules.'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/{id<\d+>}', name: 'admin_association_delete', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        $association = $this->associationRepository->find($id);
        if (!$association) {
            return $this->json(['message' => 'Association introuvable.'], Response::HTTP_NOT_FOUND);
        }

        try {
            foreach ($association->getUsers() as $user) {
                $user->setAssociation(null);
                $this->entityManager->remove($user);
            }

            foreach ($association->getDocumentJustificatifs() as $doc) {
                if ($doc->getFichierUrl()) {
                    $this->documentStorage->delete($doc->getFichierUrl());
                }
                $this->entityManager->remove($doc);
            }

            $this->entityManager->remove($association);
            $this->entityManager->flush();

            return $this->json(null, Response::HTTP_NO_CONTENT);
        } catch (\Throwable $e) {
            return $this->json(['message' => 'Erreur lors de la suppression de l’association.'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/{id<\d+>}/documents', name: 'admin_association_document_create', methods: ['POST'])]
    public function addDocument(int $id, Request $request): JsonResponse
    {
        $association = $this->associationRepository->find($id);
        if (!$association) {
            return $this->json(['message' => 'Association introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $file = $request->files->get('file');
        if (!$file instanceof UploadedFile || !$file->isValid()) {
            return $this->json(['message' => 'Fichier invalide ou manquant.'], Response::HTTP_BAD_REQUEST);
        }

        try {
            $storedFile = $this->documentStorage->store($file);

            $typeDocument = (string) $request->request->get('typeDocument', $storedFile['originalName']);
            if (trim($typeDocument) === '') {
                $typeDocument = $storedFile['originalName'];
            }
            $isVerified = filter_var($request->request->get('isVerified', false), FILTER_VALIDATE_BOOLEAN);

            $doc = new DocumentJustificatif();
            $doc->setAssociation($association);
            $doc->setTypeDocument($typeDocument);
            $doc->setFichierUrl($storedFile['path']);
            $doc->setDescription(json_encode([
                'verified' => $isVerified,
                'size' => $storedFile['size'],
                'originalName' => $storedFile['originalName'],
                'mimeType' => $storedFile['mimeType'],
            ], JSON_THROW_ON_ERROR));

            $this->entityManager->persist($doc);
            $this->entityManager->flush();

            return $this->json(self::serializeDocument($doc), Response::HTTP_CREATED);
        } catch (\InvalidArgumentException $e) {
            return $this->json(['message' => $e->getMessage()], Response::HTTP_UNPROCESSABLE_ENTITY);
        } catch (\Throwable $e) {
            return $this->json(['message' => 'Erreur lors de l’enregistrement du document.'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/{id<\d+>}/documents/{docId<\d+>}', name: 'admin_association_document_update', methods: ['PATCH'])]
    public function updateDocument(int $id, int $docId, Request $request): JsonResponse
    {
        $association = $this->associationRepository->find($id);
        if (!$association) {
            return $this->json(['message' => 'Association introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $doc = $this->entityManager->getRepository(DocumentJustificatif::class)->find($docId);
        if (!$doc || $doc->getAssociation()?->getId() !== $association->getId() || $doc->getDeletedAt() !== null) {
            return $this->json(['message' => 'Document introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $payload = json_decode($request->getContent(), true);
        if (!is_array($payload)) {
            return $this->json(['message' => 'Le corps de la requête est invalide.'], Response::HTTP_BAD_REQUEST);
        }

        try {
            if (isset($payload['typeDocument']) && is_string($payload['typeDocument']) && trim($payload['typeDocument']) !== '') {
                $doc->setTypeDocument(trim($payload['typeDocument']));
            }

            if (isset($payload['isVerified']) && is_bool($payload['isVerified'])) {
                $currentMeta = [];
                if ($doc->getDescription()) {
                    $decoded = json_decode($doc->getDescription(), true);
                    if (is_array($decoded)) {
                        $currentMeta = $decoded;
                    }
                }
                $currentMeta['verified'] = $payload['isVerified'];
                $doc->setDescription(json_encode($currentMeta, JSON_THROW_ON_ERROR));
            }

            $this->entityManager->flush();

            return $this->json(self::serializeDocument($doc));
        } catch (\Throwable $e) {
            return $this->json(['message' => 'Erreur lors de la mise à jour du document.'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/{id<\d+>}/documents/{docId<\d+>}', name: 'admin_association_document_delete', methods: ['DELETE'])]
    public function deleteDocument(int $id, int $docId): JsonResponse
    {
        $association = $this->associationRepository->find($id);
        if (!$association) {
            return $this->json(['message' => 'Association introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $doc = $this->entityManager->getRepository(DocumentJustificatif::class)->find($docId);
        if (!$doc || $doc->getAssociation()?->getId() !== $association->getId() || $doc->getDeletedAt() !== null) {
            return $this->json(['message' => 'Document introuvable.'], Response::HTTP_NOT_FOUND);
        }

        try {
            $doc->setDeletedAt(new \DateTimeImmutable());
            $this->entityManager->flush();

            return $this->json(null, Response::HTTP_NO_CONTENT);
        } catch (\Throwable $e) {
            return $this->json(['message' => 'Erreur lors de la suppression du document.'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }


    /**
     * @return array<string, mixed>
     */
    private static function serializeDocument(DocumentJustificatif $doc): array
    {
        $meta = [];
        if ($doc->getDescription()) {
            $decoded = json_decode($doc->getDescription(), true);
            if (is_array($decoded)) {
                $meta = $decoded;
            }
        }

        return [
            'id' => $doc->getId(),
            'typeDocument' => $doc->getTypeDocument(),
            'fichierUrl' => $doc->getId() !== null ? '/api/documents/' . $doc->getId() . '/download' : null,
            'isVerified' => (bool) ($meta['verified'] ?? false),
            'size' => (int) ($meta['size'] ?? 0),
            'originalName' => $meta['originalName'] ?? $doc->getTypeDocument(),
            'mimeType' => $meta['mimeType'] ?? 'application/pdf',
            'createdAt' => $doc->getCreatedAt()?->format(\DateTimeInterface::ATOM),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private static function serializeAssociation(Association $association): array
    {
        $permissions = [];
        if ($association->isModuleSubventionActif()) {
            $permissions[] = 'subventions';
        }
        if ($association->isModuleMaterielActif()) {
            $permissions[] = 'materiel';
        }
        if ($association->isModuleSalleActif()) {
            $permissions[] = 'salles';
        }
        if ($association->isModuleEvenementActif()) {
            $permissions[] = 'evenements';
        }

        $primaryUser = $association->getUsers()->first() ?: null;

        $documents = [];
        foreach ($association->getDocumentJustificatifs() as $doc) {
            if ($doc->getDeletedAt() === null) {
                $documents[] = self::serializeDocument($doc);
            }
        }

        return [
            'id' => $association->getId(),
            'nom' => $association->getNom(),
            'nombreMembres' => $association->getNombreMembres(),
            'statut' => $association->getStatut(),
            'permissions' => $permissions,
            'createdAt' => $association->getCreatedAt()?->format(\DateTimeInterface::ATOM),
            'contact' => $primaryUser ? [
                'nom' => $primaryUser->getNom(),
                'prenom' => $primaryUser->getPrenom(),
                'email' => $primaryUser->getEmail(),
                'telephone' => $primaryUser->getTelephone(),
            ] : null,
            'documents' => $documents,
        ];
    }
}