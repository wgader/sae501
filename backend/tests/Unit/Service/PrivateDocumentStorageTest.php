<?php

declare(strict_types=1);

namespace App\Tests\Unit\Service;

use App\Service\PrivateDocumentStorage;
use App\Tests\Fixtures\UploadFixtures;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class PrivateDocumentStorageTest extends TestCase
{
    private UploadFixtures $fixtures;
    private string $storageDirectory;
    private PrivateDocumentStorage $storage;

    protected function setUp(): void
    {
        $this->fixtures = new UploadFixtures();
        $this->storageDirectory = $this->fixtures->directory().'/storage';
        mkdir($this->storageDirectory);
        $this->storage = new PrivateDocumentStorage($this->storageDirectory);
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
        yield 'PDF' => ['pdf', 'application/pdf', 'pdf'];
        yield 'PNG' => ['png', 'image/png', 'png'];
        yield 'JPEG' => ['jpeg', 'image/jpeg', 'jpg'];
        yield 'WebP' => ['webp', 'image/webp', 'webp'];
    }

    #[DataProvider('acceptedFileProvider')]
    public function testAcceptedFileIsStoredUnderARandomName(string $fixture, string $expectedMimeType, string $expectedExtension): void
    {
        $upload = $this->fixtures->{$fixture}('mon justificatif.'.$expectedExtension);

        $stored = $this->storage->store($upload);

        self::assertSame($expectedMimeType, $stored['mimeType']);
        self::assertSame($expectedExtension, $stored['extension']);
        self::assertSame('mon justificatif.'.$expectedExtension, $stored['originalName']);
        self::assertMatchesRegularExpression('#^\d{4}/\d{2}/[a-f0-9]{48}\.'.$expectedExtension.'$#', $stored['path']);
        self::assertFileExists($this->storageDirectory.'/'.$stored['path']);
        self::assertNotNull($this->storage->resolve($stored['path']));
    }

    public function testClientExtensionNeverDecidesTheStoredExtension(): void
    {
        $stored = $this->storage->store($this->fixtures->png('photo.php'));

        self::assertSame('png', $stored['extension']);
        self::assertStringEndsWith('.png', $stored['path']);
    }

    public function testTraversalInClientNameDoesNotAffectTheStoredPath(): void
    {
        $stored = $this->storage->store($this->fixtures->pdf('../../../config/evil.pdf'));

        self::assertStringNotContainsString('..', $stored['path']);
        self::assertFileExists($this->storageDirectory.'/'.$stored['path']);
        self::assertFileDoesNotExist($this->fixtures->directory().'/config/evil.pdf');
    }

    public function testEmptyFileIsRejected(): void
    {
        $this->expectRejection('La taille du fichier');

        $this->storage->store($this->fixtures->file('', 'vide.pdf'));
    }

    public function testFileAboveTenMegabytesIsRejected(): void
    {
        $this->expectRejection('La taille du fichier');

        $this->storage->store($this->fixtures->sized(PrivateDocumentStorage::MAX_FILE_SIZE + 1, 'gros.pdf'));
    }

    public function testFileOfExactlyTenMegabytesIsAccepted(): void
    {
        $stored = $this->storage->store($this->fixtures->sized(PrivateDocumentStorage::MAX_FILE_SIZE, 'limite.pdf'));

        self::assertSame(PrivateDocumentStorage::MAX_FILE_SIZE, $stored['size']);
    }

    #[DataProvider('activeContentProvider')]
    public function testActiveOrUnexpectedContentIsRejected(string $content, string $clientName): void
    {
        $this->expectRejection('Seuls les formats PDF, JPEG, PNG et WebP sont autorisés.');

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
        yield 'caractère nul' => ["piece\0.pdf"];
        yield 'retour à la ligne' => ["piece\n.pdf"];
        yield 'plus de 255 caractères' => [str_repeat('a', 252).'.pdf'];
    }

    #[DataProvider('invalidClientNameProvider')]
    public function testInvalidClientNameIsRejected(string $clientName): void
    {
        $this->expectRejection('Le nom du fichier est invalide.');

        $this->storage->store($this->fixtures->pdf($clientName));
    }

    public function testRejectedFileIsNeverWrittenToStorage(): void
    {
        try {
            $this->storage->store($this->fixtures->file('<?php echo 1;', 'image.png'));
        } catch (\InvalidArgumentException) {
        }

        self::assertSame([], glob($this->storageDirectory.'/*/*/*') ?: []);
    }

    private function expectRejection(string $messageFragment): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessageMatches('/'.preg_quote($messageFragment, '/').'/');
    }
}
