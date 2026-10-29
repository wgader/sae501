<?php

namespace App\Service;

use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\File\UploadedFile;

final class SecureEventFileStorage
{
    public const MAX_FILE_SIZE = 10 * 1024 * 1024;

    /**
     * @var array<string, list<string>>
     */
    private const ALLOWED_FILES = [
        'pdf' => ['application/pdf'],
        'png' => ['image/png'],
        'jpg' => ['image/jpeg'],
        'jpeg' => ['image/jpeg'],
    ];

    public function __construct(
        #[Autowire('%app.event_upload_directory%')]
        private readonly string $uploadDirectory,
    ) {
    }

    /**
     * @return array{path: string, extension: string, mimeType: string, size: int, sha256: string, originalName: string}
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

        $extension = strtolower($file->getClientOriginalExtension());
        if (!isset(self::ALLOWED_FILES[$extension])) {
            throw new \InvalidArgumentException('Le type de fichier n’est pas autorisé.');
        }

        $originalName = $file->getClientOriginalName();
        if ($originalName === '' || mb_strlen($originalName) > 255) {
            throw new \InvalidArgumentException('Le nom du fichier est invalide.');
        }

        $mimeType = $file->getMimeType();
        if ($mimeType === null || !in_array($mimeType, self::ALLOWED_FILES[$extension], true)) {
            throw new \InvalidArgumentException('L’extension et le type MIME du fichier ne correspondent pas.');
        }

        $path = $file->getPathname();
        if ($extension === 'pdf' && !str_starts_with((string) file_get_contents($path, false, null, 0, 5), '%PDF-')) {
            throw new \InvalidArgumentException('Le fichier PDF est invalide.');
        }

        if (in_array($extension, ['png', 'jpg', 'jpeg'], true) && @getimagesize($path) === false) {
            throw new \InvalidArgumentException('Le fichier image est invalide.');
        }

        $sha256 = hash_file('sha256', $path);
        if ($sha256 === false) {
            throw new \RuntimeException('Impossible de calculer l’intégrité du fichier.');
        }

        $year = date('Y');
        $month = date('m');
        $relativeDirectory = $year . DIRECTORY_SEPARATOR . $month;
        $directory = $this->uploadDirectory . DIRECTORY_SEPARATOR . $relativeDirectory;

        if (!is_dir($directory) && !mkdir($directory, 0750, true) && !is_dir($directory)) {
            throw new \RuntimeException('Le répertoire de stockage ne peut pas être créé.');
        }

        $storedName = bin2hex(random_bytes(16)) . '.' . $extension;
        $file->move($directory, $storedName);

        return [
            'path' => $relativeDirectory . '/' . $storedName,
            'extension' => $extension,
            'mimeType' => $mimeType,
            'size' => $size,
            'sha256' => $sha256,
            'originalName' => $originalName,
        ];
    }

    public function resolve(string $relativePath): ?string
    {
        $baseDirectory = realpath($this->uploadDirectory);
        if ($baseDirectory === false) {
            return null;
        }

        $absolutePath = realpath(
            $this->uploadDirectory . DIRECTORY_SEPARATOR . $relativePath
        );

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
}
