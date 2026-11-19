<?php

namespace App\Tests\Controller;

use App\DataFixtures\ControllerIntegrationFixtures;
use App\Entity\Materiel;
use App\Tests\Fixtures\UploadFixtures;
use Symfony\Component\Filesystem\Filesystem;

final class EquipmentAdministrationControllerTest extends ControllerRouteTestCase
{
    public function testEquipmentAdministrationRequiresAdminAuthentication(): void
    {
        $this->assertRequiresAuthentication('GET', '/api/admin/equipment');
    }

    public function testEquipmentListReturnsTheFixtureInventory(): void
    {
        $this->loadControllerFixtures();
        $this->authenticateAsFixtureAdmin();
        $this->client->request('GET', '/api/admin/equipment');

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains([
            [
                'designation' => 'Table pliante',
                'referenceInterne' => ControllerIntegrationFixtures::EQUIPMENT_REFERENCE,
            ],
        ]);
    }

    public function testEquipmentCreationRejectsInvalidStock(): void
    {
        $this->authenticateAsAdmin();
        $this->requestJson('POST', '/api/admin/equipment', [
            'designation' => 'Table pliante',
            'categorie' => 'mobilier',
            'stockTotal' => 0,
        ]);

        $this->assertResponseStatusCodeSame(400);
        $this->assertJsonContains([
            'errors' => ['stockTotal' => 'Le stock initial doit être strictement supérieur à zéro.'],
        ]);
    }

    public function testAdminSetsTheMaximumConsecutiveDays(): void
    {
        $this->authenticateAsAdmin();
        $this->requestJson('POST', '/api/admin/equipment', [
            'designation' => 'Sono',
            'categorie' => 'sonorisation',
            'stockTotal' => 2,
        ]);
        $equipment = json_decode((string) $this->client->getResponse()->getContent(), true);
        $this->assertSame(7, $equipment['maxConsecutiveDays']);

        $this->requestJson('PATCH', '/api/admin/equipment/'.$equipment['id'], ['maxConsecutiveDays' => 3]);
        $this->assertResponseIsSuccessful();
        $this->assertJsonContains(['maxConsecutiveDays' => 3]);

        $this->requestJson('PATCH', '/api/admin/equipment/'.$equipment['id'], ['maxConsecutiveDays' => 0]);
        $this->assertResponseStatusCodeSame(400);
    }

    public function testEquipmentCanBeCreatedAndListed(): void
    {
        $this->authenticateAsAdmin();
        $this->requestJson('POST', '/api/admin/equipment', [
            'designation' => 'Table pliante',
            'categorie' => 'mobilier',
            'stockTotal' => 10,
            'referenceInterne' => 'TAB-001',
        ]);

        $this->assertResponseStatusCodeSame(201);
        $equipment = json_decode((string) $this->client->getResponse()->getContent(), true);
        $this->assertSame('Table pliante', $equipment['designation']);
        $this->assertSame(10, $equipment['stockTotal']);

        $this->client->request('GET', '/api/admin/equipment');

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains([
            [
                'id' => $equipment['id'],
                'designation' => 'Table pliante',
                'referenceInterne' => 'TAB-001',
            ],
        ]);
    }

    public function testEquipmentPhotoIsStoredWhenItIsARealImage(): void
    {
        $fixtures = new UploadFixtures();
        (new Filesystem())->remove($this->publicUploadDirectory());
        $this->authenticateAsAdmin();

        try {
            $this->client->request('POST', '/api/admin/equipment', $this->equipmentForm(), ['photo' => $fixtures->png('barnum.png')]);
        } finally {
            $fixtures->remove();
        }

        $this->assertResponseStatusCodeSame(201);
        $equipment = json_decode((string) $this->client->getResponse()->getContent(), true);
        self::assertMatchesRegularExpression('#^/uploads/equipment/[a-f0-9]{48}\.png$#', $equipment['imagePath']);
        self::assertFileExists($this->publicUploadDirectory().'/equipment/'.basename($equipment['imagePath']));
    }

    public function testEquipmentPhotoIsRejectedWhenTheBrowserLiesAboutItsType(): void
    {
        $fixtures = new UploadFixtures();
        (new Filesystem())->remove($this->publicUploadDirectory());
        $this->authenticateAsAdmin();

        try {
            $this->client->request('POST', '/api/admin/equipment', $this->equipmentForm(), [
                'photo' => $fixtures->file('<html><script>alert(1)</script></html>', 'barnum.png', 'image/png'),
            ]);
        } finally {
            $fixtures->remove();
        }

        $this->assertResponseStatusCodeSame(400);
        $this->assertJsonContains(['errors' => ['photo' => 'Le fichier doit être une image JPEG, PNG ou WebP.']]);
        self::assertSame(0, $this->em->getRepository(Materiel::class)->count(['designation' => 'Barnum 3x3']));
        self::assertDirectoryDoesNotExist($this->publicUploadDirectory().'/equipment');
    }

    /**
     * @return array<string, string>
     */
    private function equipmentForm(): array
    {
        return ['designation' => 'Barnum 3x3', 'categorie' => 'mobilier', 'stockTotal' => '4'];
    }

    private function publicUploadDirectory(): string
    {
        $directory = static::getContainer()->getParameter('app.image_directory');
        self::assertIsString($directory);

        return $directory;
    }
}
