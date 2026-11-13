<?php

namespace App\Tests\Controller;

use App\DataFixtures\ControllerIntegrationFixtures;

final class AgentAdministrationControllerTest extends ControllerRouteTestCase
{
    public function testAgentAdministrationRequiresAdminAuthentication(): void
    {
        $this->assertRequiresAuthentication('GET', '/api/admin/agents');
    }

    public function testAgentListReturnsPersistedAgents(): void
    {
        $this->loadControllerFixtures();
        $this->authenticateAsFixtureAdmin();
        $this->client->request('GET', '/api/admin/agents');

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains([
            'items' => [[
                'email' => ControllerIntegrationFixtures::ADMIN_EMAIL,
                'nom' => 'Martin',
            ]],
        ]);
    }
}
