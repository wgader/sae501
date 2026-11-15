<?php

declare(strict_types=1);

namespace App\Tests\Unit\Service;

use App\Service\PublicImageStorage;
use App\Tests\Fixtures\UploadFixtures;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class PublicImageStorageTest extends TestCase
{
    private UploadFixtures $fixtures;
    private string $uploadDirectory;
    private PublicImageStorage $storage;

    protected function setUp(): void
    {
        $this->fixtures = new UploadFixtures();
        $this->uploadDirectory = $this->fixtures->directory().'/public-uploads';
        $this->storage = new PublicImageStorage($this->uploadDirectory);
    }

    protected function tearDown(): void
    {
        $this->fixtures->remove();
    }

    /**
     * @return iterable<string, array{string, string}>
     */
    public static function acceptedImageProvider(): iterable
    {
        yield 'PNG' => ['png', 'png'];
        yield 'JPEG' => ['jpeg', 'jpg'];
        yield 'WebP' => ['webp', 'webp'];
    }

    #[DataProvider('acceptedImageProvider')]
    public function testAcceptedImageIsStoredUnderARandomPublicName(string $fixture, string $expectedExtension): void
    {
        $path = $this->storage->store($this->fixtures->{$fixture}('photo.'.$expectedExtension), 'salles');

        self::assertMatchesRegularExpression('#^/uploads/salles/[a-f0-9]{48}\.'.$expectedExtension.'$#', $path);
        self::assertFileExists($this->uploadDirectory.'/salles/'.basename($path));
    }

    public function testClientNameAndClientMimeTypeNeverDecideTheExtension(): void
    {
        $path = $this->storage->store($this->fixtures->png('photo.php'), 'equipment');

        self::assertStringEndsWith('.png', $path);
    }

    /**
     * @return iterable<string, array{string, string, string}>
     */
    public static function spoofedContentProvider(): iterable
    {
        yield 'HTML annoncé comme PNG' => ['<html><script>alert(1)</script></html>', 'photo.png', 'image/png'];
        yield 'PHP annoncé comme JPEG' => ["<?php system(\$_GET['c']); ?>", 'photo.jpg', 'image/jpeg'];
        yield 'SVG annoncé comme PNG' => ['<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>', 'photo.png', 'image/png'];
        yield 'PDF annoncé comme WebP' => [UploadFixtures::PDF, 'photo.webp', 'image/webp'];
    }

    #[DataProvider('spoofedContentProvider')]
    public function testContentThatIsNotAnImageIsRejectedWhateverTheBrowserClaims(string $content, string $clientName, string $clientMimeType): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Le fichier doit être une image JPEG, PNG ou WebP.');

        $this->storage->store($this->fixtures->file($content, $clientName, $clientMimeType), 'salles');
    }

    public function testCorruptedImageIsRejected(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Le contenu du fichier image est invalide.');

        $this->storage->store($this->fixtures->corruptedJpeg(), 'salles');
    }

    public function testImageAboveFiveMegabytesIsRejected(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('L’image ne doit pas dépasser 5 Mo.');

        $this->storage->store($this->fixtures->sized(PublicImageStorage::MAX_FILE_SIZE + 1, 'photo.png'), 'salles');
    }

    public function testRejectedImageIsNeverWritten(): void
    {
        try {
            $this->storage->store($this->fixtures->file('<html></html>', 'photo.png', 'image/png'), 'salles');
        } catch (\InvalidArgumentException) {
        }

        self::assertDirectoryDoesNotExist($this->uploadDirectory.'/salles');
    }

    public function testDeleteOnlyTouchesItsOwnFolder(): void
    {
        $path = $this->storage->store($this->fixtures->png(), 'salles');
        $outside = $this->fixtures->directory().'/keep.txt';
        file_put_contents($outside, 'à conserver');

        $this->storage->delete('/uploads/salles/../../keep.txt', 'salles');
        $this->storage->delete('/uploads/equipment/'.basename($path), 'salles');
        self::assertFileExists($outside);
        self::assertFileExists($this->uploadDirectory.'/salles/'.basename($path));

        $this->storage->delete($path, 'salles');
        self::assertFileDoesNotExist($this->uploadDirectory.'/salles/'.basename($path));
    }

    public function testFolderNameCannotEscapeTheUploadDirectory(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        $this->storage->store($this->fixtures->png(), '../config');
    }
}
