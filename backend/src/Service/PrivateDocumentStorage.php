<?php

namespace App\Service;

use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\File\UploadedFile;

final class PrivateDocumentStorage
{
    public const MAX_FILE_SIZE = 10 * 1024 * 1024;

    /**
     * @var array<string, string>
     */
    private const ALLOWED_TYPES = [
        'application/pdf' => 'pdf',
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];

    public function __construct(
        #[Autowire('%app.private_document_directory%')]
        private readonly string $uploadDirectory,
    ) {
    }

    /**
     * @return array{path: string, mimeType: string, extension: string, size: int, originalName: string}
     */
    public function store(UploadedFile $file): array
    {
        if (!$file->isValid()) {
            throw new \InvalidArgumentException('Le fichier n’a pas pu être téléversé.');
        }

        $size = $file->getSize();
        if ($size === false || $size <= 0 || $size > self::MAX_FILE_SIZE) {
            throw new \InvalidArgumentException('La taille du fichier doit être comprise entre 1 octet et 10 Mo.');
        }

        $mimeType = $file->getMimeType();
        if (!is_string($mimeType) || !isset(self::ALLOWED_TYPES[$mimeType])) {
            throw new \InvalidArgumentException('Seuls les formats PDF, JPEG, PNG et WebP sont autorisés.');
        }

        $originalName = $file->getClientOriginalName();
        if ($originalName === '' || mb_strlen($originalName) > 255 || preg_match('/[\x00-\x1F\x7F]/', $originalName)) {
            throw new \InvalidArgumentException('Le nom du fichier est invalide.');
        }

        $path = $file->getPathname();
        if ($mimeType === 'application/pdf') {
            $signature = file_get_contents($path, false, null, 0, 5);
            if ($signature !== '%PDF-') {
                throw new \InvalidArgumentException('Le fichier PDF est invalide.');
            }
        } elseif (@getimagesize($path) === false) {
            throw new \InvalidArgumentException('Le fichier image est invalide.');
        }

        $year = date('Y');
        $month = date('m');
        $relativeDirectory = $year . DIRECTORY_SEPARATOR . $month;
        $directory = $this->uploadDirectory . DIRECTORY_SEPARATOR . $relativeDirectory;
        if (!is_dir($directory) && !mkdir($directory, 0750, true) && !is_dir($directory)) {
            throw new \RuntimeException('Le répertoire de stockage ne peut pas être créé.');
        }

        $extension = self::ALLOWED_TYPES[$mimeType];
        $storedName = bin2hex(random_bytes(24)) . '.' . $extension;
        $file->move($directory, $storedName);

        return [
            'path' => $relativeDirectory . '/' . $storedName,
            'mimeType' => $mimeType,
            'extension' => $extension,
            'size' => $size,
            'originalName' => $originalName,
        ];
    }

    public function resolve(string $relativePath): ?string
    {
        $baseDirectory = realpath($this->uploadDirectory);
        if ($baseDirectory === false || $relativePath === '') {
            return null;
        }

        $relativePath = ltrim(str_replace('\\', '/', $relativePath), '/');
        if (str_starts_with($relativePath, 'uploads/documents/')) {
            $relativePath = substr($relativePath, strlen('uploads/documents/'));
        }
        $absolutePath = realpath($this->uploadDirectory . DIRECTORY_SEPARATOR . $relativePath);
        if (
            $absolutePath === false
            || !str_starts_with($absolutePath, $baseDirectory . DIRECTORY_SEPARATOR)
            || !is_file($absolutePath)
            || !is_readable($absolutePath)
        ) {
            return null;
        }

        return $absolutePath;
    }

    public function delete(string $relativePath): void
    {
        $absolutePath = $this->resolve($relativePath);
        if ($absolutePath !== null && !unlink($absolutePath)) {
            throw new \RuntimeException('Impossible de supprimer le document.');
        }
    }
}
