<?php

namespace App\Tests\Controller;

use App\Entity\Association;
use App\Entity\ExternalEvent;
use App\Entity\ExternalEventFile;
use App\Entity\User;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\Filesystem\Filesystem;

final class ExternalEventControllerTest extends ControllerRouteTestCase
{
    private const PDF_CONTENT = "%PDF-1.4\n% synthetic event file\n";

    private string $storageDirectory;

    protected function setUp(): void
    {
        parent::setUp();

        $storageDirectory = static::getContainer()->getParameter('app.event_upload_directory');
        self::assertIsString($storageDirectory);
        $this->storageDirectory = $storageDirectory;

        $filesystem = new Filesystem();
        $filesystem->remove($this->storageDirectory);
        $filesystem->mkdir($this->storageDirectory.'/2026/11');
    }

    protected function tearDown(): void
    {
        (new Filesystem())->remove($this->storageDirectory);

        parent::tearDown();
    }

    public function testExternalEventsRequireAuthentication(): void
    {
        $this->assertRequiresAuthentication('GET', '/api/events/external');
    }

    public function testExternalEventListReturnsItsPaginationContract(): void
    {
        $this->authenticateAsAdmin();
        $this->client->request('GET', '/api/events/external');

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains([
            'page' => 1,
            'itemsPerPage' => 10,
            'totalItems' => 0,
            'items' => [],
        ]);
    }

    /**
     * @return iterable<string, array{string}>
     */
    public static function downloadRouteProvider(): iterable
    {
        yield 'municipal route' => ['/api/events/files/%d'];
        yield 'legacy municipal route' => ['/api/events/external/files/%d'];
        yield 'association route' => ['/api/events/association/files/%d'];
    }

    #[DataProvider('downloadRouteProvider')]
    public function testFileDownloadRequiresAuthentication(string $route): void
    {
        $file = $this->createStoredEventFile($this->createAssociation('Association A'));

        $this->assertRequiresAuthentication('GET', sprintf($route, $file->getId()));
    }

    public function testMunicipalAdministratorDownloadsFileWithSafeHeaders(): void
    {
        $file = $this->createStoredEventFile($this->createAssociation('Association A'), 'Plan de sécurité.pdf');
        $this->authenticateAsAdmin();

        $this->client->request('GET', sprintf('/api/events/files/%d', $file->getId()));

        $this->assertResponseIsSuccessful();
        $this->assertSafeAttachmentHeaders('application/pdf');
        self::assertStringContainsString(
            "filename*=utf-8''Plan%20de%20s%C3%A9curit%C3%A9.pdf",
            (string) $this->client->getResponse()->headers->get('Content-Disposition'),
        );
        self::assertSame(self::PDF_CONTENT, $this->client->getInternalResponse()->getContent());
    }

    public function testEventManagerAgentCanDownloadFile(): void
    {
        $file = $this->createStoredEventFile($this->createAssociation('Association A'));
        $this->authenticateAsMunicipalAgent(['ROLE_GESTION_EVENT'], 'event.agent@example.test');

        $this->client->request('GET', sprintf('/api/events/files/%d', $file->getId()));

        $this->assertResponseIsSuccessful();
    }

    public function testAgentWithoutEventRoleIsForbidden(): void
    {
        $file = $this->createStoredEventFile($this->createAssociation('Association A'));
        $this->authenticateAsMunicipalAgent(['ROLE_GESTION_SALLE'], 'room.agent@example.test');

        $this->client->request('GET', sprintf('/api/events/files/%d', $file->getId()));

        $this->assertResponseStatusCodeSame(403);
    }

    public function testAssociationCannotUseMunicipalDownloadRoute(): void
    {
        $association = $this->createAssociation('Association A');
        $file = $this->createStoredEventFile($association);
        $this->authenticateAsAssociationMember($association, 'owner@example.test');

        $this->client->request('GET', sprintf('/api/events/files/%d', $file->getId()));

        $this->assertResponseStatusCodeSame(403);
    }

    public function testOwnerAssociationDownloadsFileWithSafeHeaders(): void
    {
        $association = $this->createAssociation('Association A');
        $file = $this->createStoredEventFile($association);
        $this->authenticateAsAssociationMember($association, 'owner@example.test');

        $this->client->request('GET', sprintf('/api/events/association/files/%d', $file->getId()));

        $this->assertResponseIsSuccessful();
        $this->assertSafeAttachmentHeaders('application/pdf');
        self::assertSame(self::PDF_CONTENT, $this->client->getInternalResponse()->getContent());
    }

    public function testOtherAssociationGetsNotFound(): void
    {
        $file = $this->createStoredEventFile($this->createAssociation('Association A'));
        $this->authenticateAsAssociationMember($this->createAssociation('Association B'), 'other@example.test');

        $this->client->request('GET', sprintf('/api/events/association/files/%d', $file->getId()));

        $this->assertResponseStatusCodeSame(404);
    }

    public function testMissingStoredFileReturnsNotFound(): void
    {
        $file = $this->createEventFileRecord($this->createAssociation('Association A'), '2026/11/missing.pdf');
        $this->authenticateAsAdmin();

        $this->client->request('GET', sprintf('/api/events/files/%d', $file->getId()));

        $this->assertResponseStatusCodeSame(404);
    }

    public function testStoredPathCannotEscapeStorageDirectory(): void
    {
        $outsideFile = dirname($this->storageDirectory).'/outside-event.pdf';
        file_put_contents($outsideFile, self::PDF_CONTENT);
        $file = $this->createEventFileRecord($this->createAssociation('Association A'), '../outside-event.pdf');
        $this->authenticateAsAdmin();

        try {
            $this->client->request('GET', sprintf('/api/events/files/%d', $file->getId()));
        } finally {
            unlink($outsideFile);
        }

        $this->assertResponseStatusCodeSame(404);
    }

    public function testUnexpectedStoredMimeTypeIsServedAsBinary(): void
    {
        $file = $this->createStoredEventFile($this->createAssociation('Association A'), 'page.pdf', 'text/html');
        $this->authenticateAsAdmin();

        $this->client->request('GET', sprintf('/api/events/files/%d', $file->getId()));

        $this->assertResponseIsSuccessful();
        $this->assertResponseHeaderSame('Content-Type', 'application/octet-stream');
    }

    public function testOriginalNameWithPathSeparatorsIsSanitized(): void
    {
        $file = $this->createStoredEventFile($this->createAssociation('Association A'), 'dossier\\sous-dossier/plan.pdf');
        $this->authenticateAsAdmin();

        $this->client->request('GET', sprintf('/api/events/files/%d', $file->getId()));

        $this->assertResponseIsSuccessful();
        $disposition = (string) $this->client->getResponse()->headers->get('Content-Disposition');
        self::assertStringStartsWith('attachment;', $disposition);
        self::assertStringNotContainsString('/', $disposition);
        self::assertStringNotContainsString('\\', $disposition);
    }

    private function assertSafeAttachmentHeaders(string $expectedMimeType): void
    {
        $headers = $this->client->getResponse()->headers;
        $cacheControl = (string) $headers->get('Cache-Control');

        $this->assertResponseHeaderSame('Content-Type', $expectedMimeType);
        $this->assertResponseHeaderSame('X-Content-Type-Options', 'nosniff');
        self::assertStringStartsWith('attachment;', (string) $headers->get('Content-Disposition'));
        self::assertStringContainsString('private', $cacheControl);
        self::assertStringContainsString('no-store', $cacheControl);
        self::assertStringNotContainsString('public', $cacheControl);
        self::assertStringNotContainsString($this->storageDirectory, (string) $headers);
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
            ->setRoles(['ROLE_ASSOCIATION'])
            ->setIsVerified(true)
            ->setAssociation($association);

        return $this->persistAndAuthenticate($user);
    }

    /**
     * @param list<string> $roles
     */
    private function authenticateAsMunicipalAgent(array $roles, string $email): User
    {
        $user = (new User())
            ->setEmail($email)
            ->setNom('Agent')
            ->setPrenom('Mairie')
            ->setTypeCompte('mairie')
            ->setRoles($roles)
            ->setIsVerified(true);

        return $this->persistAndAuthenticate($user);
    }

    private function persistAndAuthenticate(User $user): User
    {
        $this->em->persist($user);
        $this->em->flush();
        $this->client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer '.$this->jwtManager->create($user));

        return $user;
    }

    private function createStoredEventFile(
        Association $association,
        string $originalName = 'plan.pdf',
        string $mimeType = 'application/pdf',
    ): ExternalEventFile {
        $storedPath = '2026/11/'.bin2hex(random_bytes(8)).'.pdf';
        file_put_contents($this->storageDirectory.'/'.$storedPath, self::PDF_CONTENT);

        return $this->createEventFileRecord($association, $storedPath, $originalName, $mimeType);
    }

    private function createEventFileRecord(
        Association $association,
        string $storedPath,
        string $originalName = 'plan.pdf',
        string $mimeType = 'application/pdf',
    ): ExternalEventFile {
        $event = (new ExternalEvent())
            ->setAssoId((int) $association->getId())
            ->setTitle('Fête du parc')
            ->setLocation('Parc municipal')
            ->setEventType('festif')
            ->setStartDate(new \DateTime('+10 days'))
            ->setEndTime(new \DateTime('+10 days 4 hours'))
            ->setStatus('PENDING')
            ->setCreatedAt(new \DateTimeImmutable());
        $this->em->persist($event);
        $this->em->flush();

        $file = (new ExternalEventFile())
            ->setEventId((int) $event->getId())
            ->setFilePath($storedPath)
            ->setFileType('plan')
            ->setOriginalName($originalName)
            ->setMimeType($mimeType)
            ->setFileSize(strlen(self::PDF_CONTENT))
            ->setSha256(hash('sha256', self::PDF_CONTENT));
        $this->em->persist($file);
        $this->em->flush();

        return $file;
    }
}
