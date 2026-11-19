<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Association;
use App\Entity\DemandeSubvention;
use App\Entity\DocumentJustificatif;
use App\Repository\DocumentJustificatifRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\File\UploadedFile;

final class SubventionDraftDocumentService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly DocumentJustificatifRepository $documentRepository,
        private readonly PrivateDocumentStorage $documentStorage,
    ) {
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function listDocuments(DemandeSubvention $draft): array
    {
        $draftId = $draft->getId();
        if (null === $draftId) {
            return [];
        }

        return array_map(
            self::serializeDocument(...),
            $this->documentRepository->findByLinkedEntity('subvention', $draftId),
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function upload(
        Association $association,
        DemandeSubvention $draft,
        UploadedFile $file,
        string $typeDocument,
    ): array {
        $typeDocument = trim($typeDocument);
        if ('' === $typeDocument || mb_strlen($typeDocument) > 100) {
            throw new \InvalidArgumentException('Le nom du document doit contenir au plus 100 caractères.');
        }

        $storedFile = $this->documentStorage->store($file);
        $document = (new DocumentJustificatif())
            ->setAssociation($association)
            ->setTypeDocument($typeDocument)
            ->setFichierUrl($storedFile['path'])
            ->setLieAType('subvention')
            ->setLieAId($draft->getId())
            ->setDescription(json_encode([
                'verified' => false,
                'size' => $storedFile['size'],
                'originalName' => $storedFile['originalName'],
                'mimeType' => $storedFile['mimeType'],
            ], JSON_THROW_ON_ERROR));

        try {
            $this->entityManager->persist($document);
            $this->entityManager->flush();
        } catch (\Throwable $exception) {
            $this->documentStorage->delete($storedFile['path']);

            throw $exception;
        }

        return self::serializeDocument($document);
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
            'fichierUrl' => null !== $document->getId()
                ? '/api/documents/'.$document->getId().'/download'
                : null,
            'originalName' => $metadata['originalName'] ?? $document->getTypeDocument(),
            'size' => (int) ($metadata['size'] ?? 0),
            'mimeType' => $metadata['mimeType'] ?? 'application/pdf',
            'createdAt' => $document->getCreatedAt()?->format(\DateTimeInterface::ATOM),
        ];
    }
}
