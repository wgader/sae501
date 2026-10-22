<?php

namespace App\Controller;

use App\Entity\Association;
use App\Repository\AssociationRepository;
use App\Service\AssociationStatusNotifier;
use App\Entity\DocumentJustificatif;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;


#[Route('/api/admin/associations')]
#[IsGranted('ROLE_ADMIN')]
final class AssociationAdministrationController extends AbstractController
{
    private const STATUSES = ['PENDING_VALIDATION', 'VALIDATED', 'REFUSED', 'SUSPENDED'];
    private const MODULES = ['subventions', 'materiel', 'salles'];

    public function __construct(
        private readonly AssociationRepository $associationRepository,
        private readonly EntityManagerInterface $entityManager,
        private readonly AssociationStatusNotifier $statusNotifier,
        #[Autowire('%kernel.project_dir%')]
        private readonly string $projectDir,
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
            }

            $this->entityManager->persist($association);
            $this->entityManager->flush();

            if ($status !== null && $previousStatus !== $status) {
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
                    $cleanFilename = basename($doc->getFichierUrl());
                    $filePath = $this->projectDir . '/public/uploads/documents/' . $cleanFilename;
                    if (file_exists($filePath) && is_file($filePath)) {
                        @unlink($filePath);
                    }
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

        if ($file->getSize() === false || $file->getSize() > 10 * 1024 * 1024) {
            return $this->json(['message' => 'Le fichier ne doit pas dépasser 10 Mo.'], Response::HTTP_BAD_REQUEST);
        }

        $mimeType = $file->getMimeType();
        $allowed = [
            'application/pdf' => 'pdf',
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
        ];

        if (!isset($allowed[$mimeType])) {
            return $this->json(['message' => 'Seuls les formats PDF, JPEG, PNG et WebP sont autorisés.'], Response::HTTP_BAD_REQUEST);
        }

        $directory = $this->projectDir . '/public/uploads/documents';
        if (!is_dir($directory) && !mkdir($directory, 0755, true) && !is_dir($directory)) {
            return $this->json(['message' => 'Impossible de préparer le répertoire de stockage.'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        try {
            $extension = $allowed[$mimeType];
            $filename = bin2hex(random_bytes(24)) . '.' . $extension;
            $fileSize = $file->getSize() ?: 0;
            $originalName = $file->getClientOriginalName();
            $file->move($directory, $filename);

            $typeDocument = (string) $request->request->get('typeDocument', $originalName);
            if (trim($typeDocument) === '') {
                $typeDocument = $originalName;
            }
            $isVerified = filter_var($request->request->get('isVerified', false), FILTER_VALIDATE_BOOLEAN);

            $doc = new DocumentJustificatif();
            $doc->setAssociation($association);
            $doc->setTypeDocument($typeDocument);
            $doc->setFichierUrl('/uploads/documents/' . $filename);
            $doc->setDescription(json_encode([
                'verified' => $isVerified,
                'size' => $fileSize,
                'originalName' => $originalName,
                'mimeType' => $mimeType,
            ], JSON_THROW_ON_ERROR));

            $this->entityManager->persist($doc);
            $this->entityManager->flush();

            return $this->json(self::serializeDocument($doc), Response::HTTP_CREATED);
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
            'fichierUrl' => $doc->getFichierUrl(),
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