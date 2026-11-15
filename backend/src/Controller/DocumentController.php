<?php

namespace App\Controller;

use App\Entity\DocumentJustificatif;
use App\Entity\User;
use App\Repository\DocumentJustificatifRepository;
use App\Service\PrivateDocumentStorage;
use App\Service\PrivateFileResponseFactory;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/documents')]
final class DocumentController extends AbstractController
{
    public function __construct(
        private readonly DocumentJustificatifRepository $documentRepository,
        private readonly PrivateDocumentStorage $documentStorage,
        private readonly PrivateFileResponseFactory $responseFactory,
    ) {
    }

    #[Route('/{id<\d+>}/download', name: 'api_document_download', methods: ['GET'])]
    public function download(int $id): BinaryFileResponse|JsonResponse
    {
        $document = $this->documentRepository->find($id);
        $user = $this->getUser();
        if (!$document instanceof DocumentJustificatif || null !== $document->getDeletedAt() || !$user instanceof User) {
            return $this->json(['message' => 'Document introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $isMunicipalUser = [] !== array_intersect(User::ROLES_MAIRIE, $user->getRoles());
        $documentAssociationId = $document->getAssociation()?->getId();
        $userAssociationId = $user->getAssociation()?->getId();
        if (!$isMunicipalUser && (null === $documentAssociationId || $documentAssociationId !== $userAssociationId)) {
            return $this->json(['message' => 'Document introuvable.'], Response::HTTP_NOT_FOUND);
        }

        return $this->downloadDocument($document);
    }

    private function downloadDocument(DocumentJustificatif $document): BinaryFileResponse|JsonResponse
    {
        $filePath = $this->documentStorage->resolve((string) $document->getFichierUrl());
        if (null === $filePath) {
            return $this->json(['message' => 'Document introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $metadata = json_decode($document->getDescription() ?? '', true);
        $metadata = is_array($metadata) ? $metadata : [];
        $originalName = is_string($metadata['originalName'] ?? null) ? $metadata['originalName'] : null;
        // Seuls les types validés à l’upload sont fiables ; tout autre type n’est jamais interprété par le navigateur.
        $mimeType = is_string($metadata['mimeType'] ?? null) && $this->documentStorage->isAllowedMimeType($metadata['mimeType'])
            ? $metadata['mimeType']
            : 'application/octet-stream';

        return $this->responseFactory->attachment($filePath, $mimeType, $originalName, 'document');
    }
}
