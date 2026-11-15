<?php

namespace App\Controller;

use App\Entity\DocumentJustificatif;
use App\Entity\User;
use App\Repository\DocumentJustificatifRepository;
use App\Service\PrivateDocumentStorage;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/documents')]
final class DocumentController extends AbstractController
{
    public function __construct(
        private readonly DocumentJustificatifRepository $documentRepository,
        private readonly PrivateDocumentStorage $documentStorage,
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
        // Separators are replaced because Content-Disposition rejects them (HTTP 500).
        $originalName = is_string($metadata['originalName'] ?? null)
            ? trim(str_replace(['/', '\\'], '_', $metadata['originalName']))
            : '';
        if ('' === $originalName) {
            $originalName = 'document';
        }
        // Only types validated at upload are trusted; anything else is never rendered by the browser.
        $mimeType = is_string($metadata['mimeType'] ?? null) && $this->documentStorage->isAllowedMimeType($metadata['mimeType'])
            ? $metadata['mimeType']
            : 'application/octet-stream';

        $response = new BinaryFileResponse($filePath, Response::HTTP_OK, [], false);
        // Private documents must never be kept by shared caches (proxy, CDN, WAF).
        $response->setCache(['private' => true, 'no_store' => true]);
        $response->headers->set('Content-Type', $mimeType);
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->setContentDisposition(ResponseHeaderBag::DISPOSITION_ATTACHMENT, $originalName);

        return $response;
    }
}
