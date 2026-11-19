<?php

namespace App\Service;

use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\File\UploadedFile;

/**
 * Images des salles, du matériel et des logos d'association. Elles sont rangées hors de la racine
 * web et servies par MediaController après contrôle des droits ; leur contenu réel est vérifié
 * avant tout enregistrement. L'adresse enregistrée en base reste /uploads/<dossier>/<fichier>.
 */
final class ImageStorage
{
    public const MAX_FILE_SIZE = 5 * 1024 * 1024;
    public const MAX_DIMENSION = 8000;

    /**
     * @var array<string, string>
     */
    private const ALLOWED_TYPES = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];

    public function __construct(
        #[Autowire('%app.image_directory%')]
        private readonly string $uploadDirectory,
        private readonly ?AntivirusScanner $antivirus = null,
    ) {
    }

    /**
     * @throws \InvalidArgumentException si le fichier n’est pas une image autorisée
     */
    public function validate(UploadedFile $image): void
    {
        if (!$image->isValid()) {
            throw new \InvalidArgumentException('Le transfert de l’image a échoué.');
        }

        $size = $image->getSize();
        if (false === $size || $size <= 0 || $size > self::MAX_FILE_SIZE) {
            throw new \InvalidArgumentException('L’image ne doit pas dépasser 5 Mo.');
        }

        // Le type annoncé par le navigateur est ignoré : seul le contenu du fichier fait foi.
        if (!isset(self::ALLOWED_TYPES[(string) $image->getMimeType()])) {
            throw new \InvalidArgumentException('Le fichier doit être une image JPEG, PNG ou WebP.');
        }

        $dimensions = @getimagesize($image->getPathname());
        if (
            false === $dimensions
            || $dimensions[0] < 1
            || $dimensions[1] < 1
            || $dimensions[0] > self::MAX_DIMENSION
            || $dimensions[1] > self::MAX_DIMENSION
        ) {
            throw new \InvalidArgumentException('Le contenu du fichier image est invalide.');
        }
    }

    /**
     * @return string adresse de l'image, par exemple /uploads/salles/abc.png
     */
    public function store(UploadedFile $image, string $folder): string
    {
        $this->validate($image);
        $directory = $this->folderDirectory($folder);
        if (!is_dir($directory) && !mkdir($directory, 0755, true) && !is_dir($directory)) {
            throw new \RuntimeException('Le répertoire de stockage des images est indisponible.');
        }

        $filename = bin2hex(random_bytes(24)).'.'.self::ALLOWED_TYPES[(string) $image->getMimeType()];
        // Analyse avant tout enregistrement : un fichier infecté n’arrive jamais sur le disque.
        $this->antivirus?->assertClean($image->getPathname());
        $image->move($directory, $filename);

        return '/uploads/'.$folder.'/'.$filename;
    }

    public function delete(string $publicPath, string $folder): void
    {
        $prefix = '/uploads/'.$folder.'/';
        if (!str_starts_with($publicPath, $prefix)) {
            return;
        }

        $fullPath = $this->folderDirectory($folder).'/'.basename($publicPath);
        if (is_file($fullPath) && !unlink($fullPath)) {
            throw new \RuntimeException('Impossible de supprimer l’ancienne image.');
        }
    }

    /**
     * Fichier correspondant à une adresse /uploads/<dossier>/<fichier>, ou null s'il n'existe pas.
     * Le nom est vérifié strictement : aucun chemin ne peut sortir du dossier des images.
     */
    public function locate(string $folder, string $filename): ?string
    {
        if (1 !== preg_match('/^[a-f0-9]{48}\.(jpg|png|webp)$/', $filename)) {
            return null;
        }

        $path = $this->folderDirectory($folder).'/'.$filename;

        return is_file($path) ? $path : null;
    }

    private function folderDirectory(string $folder): string
    {
        if (1 !== preg_match('/^[a-z]+$/', $folder)) {
            throw new \InvalidArgumentException('Dossier d’images invalide.');
        }

        return $this->uploadDirectory.'/'.$folder;
    }
}
