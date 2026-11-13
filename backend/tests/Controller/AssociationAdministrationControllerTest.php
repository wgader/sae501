<?php

namespace App\Tests\Controller;

use App\DataFixtures\ControllerIntegrationFixtures;

final class AssociationAdministrationControllerTest extends ControllerRouteTestCase
{
    public function testAssociationAdministrationRequiresAdminAuthentication(): void
    {
        $this->assertRequiresAuthentication('GET', '/api/admin/associations');
    }

    public function testAssociationListReturnsItsPaginationContract(): void
    {
        $this->loadControllerFixtures();
        $this->authenticateAsFixtureAdmin();
        $this->client->request('GET', '/api/admin/associations');

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains([
            'page' => 1,
            'itemsPerPage' => 10,
            'totalItems' => 1,
            'items' => [[
                'nom' => ControllerIntegrationFixtures::ASSOCIATION_NAME,
                'statut' => 'VALIDATED',
            ]],
        ]);
    }
}
