<?php

declare(strict_types=1);

namespace App\Tests\Controller;

use App\Entity\Association;
use App\Entity\DocumentJustificatif;
use App\Entity\User;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\Filesystem\Filesystem;

final class DocumentControllerTest extends ControllerRouteTestCase
{
    private const PDF_CONTENT = "%PDF-1.4\n% synthetic test document\n";

    private string $storageDirectory;
    private string $outsideDirectory;

    protected function setUp(): void
    {
        parent::setUp();

        $storageDirectory = static::getContainer()->getParameter('app.private_document_directory');
        self::assertIsString($storageDirectory);
        $this->storageDirectory = $storageDirectory;
        $this->outsideDirectory = dirname($storageDirectory).'/outside-storage';

        $filesystem = new Filesystem();
        $filesystem->remove([$this->storageDirectory, $this->outsideDirectory]);
        $filesystem->mkdir([$this->storageDirectory.'/2026/11', $this->outsideDirectory]);
    }

    protected function tearDown(): void
    {
        (new Filesystem())->remove([$this->storageDirectory, $this->outsideDirectory]);

        parent::tearDown();
    }

    public function testLegacyPublicPathIsNotServed(): void
    {
        $this->client->request('GET', '/uploads/documents/missing-document.pdf');

        $this->assertResponseStatusCodeSame(404);
    }

    public function testDownloadRequiresAuthentication(): void
    {
        $document = $this->createStoredDocument($this->createAssociation('Association A'));

        $this->assertRequiresAuthentication('GET', $this->downloadUri($document));
    }

    public function testOwnerCanDownloadDocumentWithSafeHeaders(): void
    {
        $association = $this->createAssociation('Association A');
        $document = $this->createStoredDocument($association, 'Budget prévisionnel.pdf');
        $this->authenticateAsAssociationMember($association, 'owner@example.test');

        $this->client->request('GET', $this->downloadUri($document));

        $this->assertResponseIsSuccessful();
        $this->assertResponseHeaderSame('Content-Type', 'application/pdf');
        $this->assertResponseHeaderSame('X-Content-Type-Options', 'nosniff');
        $disposition = (string) $this->client->getResponse()->headers->get('Content-Disposition');
        self::assertStringStartsWith('attachment;', $disposition);
        self::assertStringContainsString("filename*=utf-8''Budget%20pr%C3%A9visionnel.pdf", $disposition);
        self::assertSame(self::PDF_CONTENT, $this->client->getInternalResponse()->getContent());
    }

    public function testPrivateDocumentIsNeverStoredByCaches(): void
    {
        $association = $this->createAssociation('Association A');
        $document = $this->createStoredDocument($association);
        $this->authenticateAsAssociationMember($association, 'owner@example.test');

        $this->client->request('GET', $this->downloadUri($document));

        $this->assertResponseIsSuccessful();
        $cacheControl = (string) $this->client->getResponse()->headers->get('Cache-Control');
        self::assertStringContainsString('private', $cacheControl);
        self::assertStringContainsString('no-store', $cacheControl);
        self::assertStringNotContainsString('public', $cacheControl);
    }

    public function testResponseDoesNotLeakTheStoragePath(): void
    {
        $association = $this->createAssociation('Association A');
        $document = $this->createStoredDocument($association);
        $this->authenticateAsAssociationMember($association, 'owner@example.test');

        $this->client->request('GET', $this->downloadUri($document));

        $this->assertResponseIsSuccessful();
        $headers = (string) $this->client->getResponse()->headers;
        self::assertStringNotContainsString($this->storageDirectory, $headers);
        self::assertStringNotContainsString('2026/11', $headers);
    }

    public function testMemberOfAnotherAssociationGetsNotFound(): void
    {
        $document = $this->createStoredDocument($this->createAssociation('Association A'));
        $this->authenticateAsAssociationMember($this->createAssociation('Association B'), 'other@example.test');

        $this->client->request('GET', $this->downloadUri($document));

        $this->assertResponseStatusCodeSame(404);
        $this->assertJsonContains(['message' => 'Document introuvable.']);
    }

    public function testUserWithoutAssociationGetsNotFound(): void
    {
        $document = $this->createStoredDocument($this->createAssociation('Association A'));
        $user = (new User())
            ->setEmail('no-association@example.test')
            ->setNom('Sans')
            ->setPrenom('Association')
            ->setTypeCompte('association')
            ->setIsVerified(true);
        $this->em->persist($user);
        $this->em->flush();
        $this->client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer '.$this->jwtManager->create($user));

        $this->client->request('GET', $this->downloadUri($document));

        $this->assertResponseStatusCodeSame(404);
    }

    public function testMunicipalAdministratorCanDownloadAnyAssociationDocument(): void
    {
        $document = $this->createStoredDocument($this->createAssociation('Association A'));
        $this->authenticateAsAdmin();

        $this->client->request('GET', $this->downloadUri($document));

        $this->assertResponseIsSuccessful();
        self::assertSame(self::PDF_CONTENT, $this->client->getInternalResponse()->getContent());
    }

    public function testUnknownDocumentReturnsNotFound(): void
    {
        $this->authenticateAsAdmin();

        $this->client->request('GET', '/api/documents/999999/download');

        $this->assertResponseStatusCodeSame(404);
    }

    public function testNonNumericIdentifierIsRejected(): void
    {
        $this->authenticateAsAdmin();

        $this->client->request('GET', '/api/documents/..%2F1/download');

        $this->assertResponseStatusCodeSame(404);
    }

    public function testDocumentWhoseFileIsMissingReturnsNotFound(): void
    {
        $document = $this->createDocumentRecord($this->createAssociation('Association A'), '2026/11/missing.pdf');
        $this->authenticateAsAdmin();

        $this->client->request('GET', $this->downloadUri($document));

        $this->assertResponseStatusCodeSame(404);
    }

    public function testSoftDeletedDocumentReturnsNotFound(): void
    {
        $association = $this->createAssociation('Association A');
        $document = $this->createStoredDocument($association);
        $document->setDeletedAt(new \DateTimeImmutable());
        $this->em->flush();
        $this->authenticateAsAssociationMember($association, 'owner@example.test');

        $this->client->request('GET', $this->downloadUri($document));

        $this->assertResponseStatusCodeSame(404);
    }

    /**
     * @return iterable<string, array{string}>
     */
    public static function traversalPathProvider(): iterable
    {
        yield 'parent directory' => ['../outside-storage/secret.pdf'];
        yield 'nested parent directory' => ['2026/11/../../../outside-storage/secret.pdf'];
        yield 'backslash parent directory' => ['..\\outside-storage\\secret.pdf'];
        yield 'encoded parent directory' => ['%2e%2e/outside-storage/secret.pdf'];
    }

    #[DataProvider('traversalPathProvider')]
    public function testStoredPathCannotEscapeStorageDirectory(string $storedPath): void
    {
        file_put_contents($this->outsideDirectory.'/secret.pdf', self::PDF_CONTENT);
        $document = $this->createDocumentRecord($this->createAssociation('Association A'), $storedPath);
        $this->authenticateAsAdmin();

        $this->client->request('GET', $this->downloadUri($document));

        $this->assertResponseStatusCodeSame(404);
    }

    public function testAbsoluteStoredPathCannotEscapeStorageDirectory(): void
    {
        $outsideFile = $this->outsideDirectory.'/secret.pdf';
        file_put_contents($outsideFile, self::PDF_CONTENT);
        $document = $this->createDocumentRecord($this->createAssociation('Association A'), $outsideFile);
        $this->authenticateAsAdmin();

        $this->client->request('GET', $this->downloadUri($document));

        $this->assertResponseStatusCodeSame(404);
    }

    public function testSymlinkPointingOutsideStorageIsRejected(): void
    {
        $outsideFile = $this->outsideDirectory.'/secret.pdf';
        file_put_contents($outsideFile, self::PDF_CONTENT);
        symlink($outsideFile, $this->storageDirectory.'/2026/11/link.pdf');
        $document = $this->createDocumentRecord($this->createAssociation('Association A'), '2026/11/link.pdf');
        $this->authenticateAsAdmin();

        $this->client->request('GET', $this->downloadUri($document));

        $this->assertResponseStatusCodeSame(404);
    }

    public function testLegacyStoredPathIsResolvedInsidePrivateStorage(): void
    {
        file_put_contents($this->storageDirectory.'/legacy.pdf', self::PDF_CONTENT);
        $document = $this->createDocumentRecord($this->createAssociation('Association A'), '/uploads/documents/legacy.pdf');
        $this->authenticateAsAdmin();

        $this->client->request('GET', $this->downloadUri($document));

        $this->assertResponseIsSuccessful();
    }

    public function testOriginalNameWithPathSeparatorsIsSanitized(): void
    {
        $association = $this->createAssociation('Association A');
        $document = $this->createStoredDocument($association, 'dossier\\sous-dossier\\name.pdf');
        $this->authenticateAsAssociationMember($association, 'owner@example.test');

        $this->client->request('GET', $this->downloadUri($document));

        $this->assertResponseIsSuccessful();
        $disposition = (string) $this->client->getResponse()->headers->get('Content-Disposition');
        self::assertStringStartsWith('attachment;', $disposition);
        self::assertStringNotContainsString('/', $disposition);
        self::assertStringNotContainsString('\\', $disposition);
    }

    public function testUnexpectedStoredMimeTypeIsServedAsBinary(): void
    {
        $association = $this->createAssociation('Association A');
        $document = $this->createStoredDocument($association, 'page.pdf', 'text/html');
        $this->authenticateAsAssociationMember($association, 'owner@example.test');

        $this->client->request('GET', $this->downloadUri($document));

        $this->assertResponseIsSuccessful();
        $this->assertResponseHeaderSame('Content-Type', 'application/octet-stream');
    }

    private function createAssociation(string $name): Association
    {
        $association = (new Association())->setNom($name);
        $this->em->persist($association);
        $this->em->flush();

        return $association;
    }

    private function authenticateAsAssociationMember(Association $association, string $email): User
    {
        $user = (new User())
            ->setEmail($email)
            ->setNom('Membre')
            ->setPrenom('Association')
            ->setTypeCompte('association')
            ->setIsVerified(true)
            ->setAssociation($association);
        $this->em->persist($user);
        $this->em->flush();

        $this->client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer '.$this->jwtManager->create($user));

        return $user;
    }

    private function createStoredDocument(
        Association $association,
        string $originalName = 'justificatif.pdf',
        string $mimeType = 'application/pdf',
    ): DocumentJustificatif {
        $storedPath = '2026/11/'.bin2hex(random_bytes(8)).'.pdf';
        file_put_contents($this->storageDirectory.'/'.$storedPath, self::PDF_CONTENT);

        return $this->createDocumentRecord($association, $storedPath, $originalName, $mimeType);
    }

    private function createDocumentRecord(
        Association $association,
        string $storedPath,
        string $originalName = 'justificatif.pdf',
        string $mimeType = 'application/pdf',
    ): DocumentJustificatif {
        $document = (new DocumentJustificatif())
            ->setAssociation($association)
            ->setTypeDocument('Justificatif')
            ->setFichierUrl($storedPath)
            ->setDescription(json_encode([
                'verified' => false,
                'size' => strlen(self::PDF_CONTENT),
                'originalName' => $originalName,
                'mimeType' => $mimeType,
            ], JSON_THROW_ON_ERROR));
        $this->em->persist($document);
        $this->em->flush();

        return $document;
    }

    private function downloadUri(DocumentJustificatif $document): string
    {
        return '/api/documents/'.$document->getId().'/download';
    }
}
