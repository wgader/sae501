<?php

namespace App\Tests\Controller;

use App\DataFixtures\ControllerIntegrationFixtures;

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
}
