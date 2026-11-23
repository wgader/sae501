<?php

declare(strict_types=1);

namespace App\Tests\Controller;

use Symfony\Component\Filesystem\Filesystem;

/**
 * Les images ne sont jamais servies telles quelles : chaque demande passe par le contrôle des droits.
 */
final class MediaControllerTest extends ControllerRouteTestCase
{
    private string $mediaDirectory;

    protected function setUp(): void
    {
        parent::setUp();
        $this->mediaDirectory = (string) static::getContainer()->getParameter('app.image_directory');
        (new Filesystem())->remove($this->mediaDirectory);
    }

    protected function tearDown(): void
    {
        (new Filesystem())->remove($this->mediaDirectory);
        parent::tearDown();
    }

    public function testRoomImageNeedsALoggedInAccountWithTheRoomsModule(): void
    {
        $uri = $this->storeImage('salles');

        $this->client->request('GET', $uri);
        $this->assertResponseStatusCodeSame(401);

        $this->signInAssociationMember(['materiel'], 'sans-salles@example.test');
        $this->client->request('GET', $uri);
        $this->assertResponseStatusCodeSame(403);

        $this->signInAssociationMember(['salles'], 'avec-salles@example.test');
        $this->client->request('GET', $uri);
        $this->assertResponseIsSuccessful();
        self::assertStringContainsString('private', (string) $this->client->getResponse()->headers->get('Cache-Control'));
    }

    public function testEquipmentImageIsReservedToTheEquipmentModule(): void
    {
        $uri = $this->storeImage('equipment');

        $this->signInAgent(['ROLE_GESTION_SALLE'], 'salle@example.test');
        $this->client->request('GET', $uri);
        $this->assertResponseStatusCodeSame(403);

        $this->signInAgent(['ROLE_GESTION_MATERIEL'], 'materiel@example.test');
        $this->client->request('GET', $uri);
        $this->assertResponseIsSuccessful();
    }

    public function testALogoIsVisibleToItsAssociationAndTheTownHallOnly(): void
    {
        $uri = $this->storeImage('associations');
        $owner = $this->signInAssociationMember([], 'proprietaire@example.test');
        $owner->getAssociation()?->setLogoUrl($uri);
        $this->em->flush();

        $this->client->request('GET', $uri);
        $this->assertResponseIsSuccessful();

        $this->signInAssociationMember([], 'autre@example.test');
        $this->client->request('GET', $uri);
        $this->assertResponseStatusCodeSame(403);

        $this->signInAgent(['ROLE_GESTION_EVENT'], 'agent@example.test');
        $this->client->request('GET', $uri);
        $this->assertResponseIsSuccessful();
    }

    public function testOnlyGeneratedFileNamesAreServed(): void
    {
        $this->authenticateAsAdmin();
        foreach (['/uploads/salles/../../.env', '/uploads/documents/x.pdf', '/uploads/salles/image.png'] as $uri) {
            $this->client->request('GET', $uri);
            $this->assertResponseStatusCodeSame(404, $uri);
        }
    }

    private function storeImage(string $folder): string
    {
        $filename = bin2hex(random_bytes(24)).'.png';
        (new Filesystem())->dumpFile(
            $this->mediaDirectory.'/'.$folder.'/'.$filename,
            (string) base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', true),
        );

        return '/uploads/'.$folder.'/'.$filename;
    }
}
