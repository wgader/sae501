<?php

declare(strict_types=1);

namespace App\Tests\Unit\Service;

use App\Service\SecureEventFileStorage;
use App\Tests\Fixtures\UploadFixtures;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class SecureEventFileStorageTest extends TestCase
{
    private UploadFixtures $fixtures;
    private string $storageDirectory;
    private SecureEventFileStorage $storage;

    protected function setUp(): void
    {
        $this->fixtures = new UploadFixtures();
        $this->storageDirectory = $this->fixtures->directory().'/storage';
        mkdir($this->storageDirectory);
        $this->storage = new SecureEventFileStorage($this->storageDirectory);
    }

    protected function tearDown(): void
    {
        $this->fixtures->remove();
    }

    /**
     * @return iterable<string, array{string, string, string}>
     */
    public static function acceptedFileProvider(): iterable
    {
        yield 'PDF' => ['pdf', 'plan.pdf', 'application/pdf'];
        yield 'PNG' => ['png', 'plan.png', 'image/png'];
        yield 'JPEG en .jpg' => ['jpeg', 'plan.jpg', 'image/jpeg'];
        yield 'JPEG en .jpeg' => ['jpeg', 'plan.jpeg', 'image/jpeg'];
    }

    #[DataProvider('acceptedFileProvider')]
    public function testAcceptedFileIsStoredWithItsChecksum(string $fixture, string $clientName, string $expectedMimeType): void
    {
        $upload = $this->fixtures->{$fixture}($clientName);
        $expectedChecksum = hash_file('sha256', $upload->getPathname());

        $stored = $this->storage->store($upload);

        self::assertSame($expectedMimeType, $stored['mimeType']);
        self::assertSame($expectedChecksum, $stored['sha256']);
        self::assertMatchesRegularExpression('#^\d{4}/\d{2}/[a-f0-9]{32}\.[a-z]+$#', $stored['path']);
        self::assertNotNull($this->storage->resolve($stored['path']));
    }

    public function testExtensionAndContentMustMatch(): void
    {
        $this->expectRejection('L’extension et le type MIME du fichier ne correspondent pas.');

        $this->storage->store($this->fixtures->pdf('plan.png'));
    }

    public function testWebpIsNotAcceptedForEvents(): void
    {
        $this->expectRejection('Le type de fichier n’est pas autorisé.');

        $this->storage->store($this->fixtures->webp());
    }

    public function testEmptyFileIsRejected(): void
    {
        $this->expectRejection('La taille du fichier');

        $this->storage->store($this->fixtures->file('', 'plan.pdf'));
    }

    public function testFileAboveTenMegabytesIsRejected(): void
    {
        $this->expectRejection('La taille du fichier');

        $this->storage->store($this->fixtures->sized(SecureEventFileStorage::MAX_FILE_SIZE + 1, 'plan.pdf'));
    }

    #[DataProvider('activeContentProvider')]
    public function testActiveOrUnexpectedContentIsRejected(string $content, string $clientName): void
    {
        $this->expectException(\InvalidArgumentException::class);

        $this->storage->store($this->fixtures->file($content, $clientName));
    }

    /**
     * @return iterable<string, array{string, string}>
     */
    public static function activeContentProvider(): iterable
    {
        return UploadFixtures::activeContents();
    }

    public function testCorruptedImageWithValidMagicBytesIsRejected(): void
    {
        $this->expectRejection('Le fichier image est invalide.');

        $this->storage->store($this->fixtures->corruptedJpeg());
    }

    /**
     * @return iterable<string, array{string}>
     */
    public static function invalidClientNameProvider(): iterable
    {
        yield 'caractère nul' => ["plan\0.pdf"];
        yield 'retour à la ligne' => ["plan\n.pdf"];
        yield 'plus de 255 caractères' => [str_repeat('a', 252).'.pdf'];
    }

    #[DataProvider('invalidClientNameProvider')]
    public function testInvalidClientNameIsRejected(string $clientName): void
    {
        $this->expectRejection('Le nom du fichier est invalide.');

        $this->storage->store($this->fixtures->pdf($clientName));
    }

    private function expectRejection(string $messageFragment): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessageMatches('/'.preg_quote($messageFragment, '/').'/');
    }
}
