<?php

namespace App\Tests\Controller;

/**
 * Le catalogue du matériel n'est visible que par les comptes qui ont le module matériel.
 */
final class EquipmentCatalogControllerTest extends ControllerRouteTestCase
{
    public function testCatalogRequiresAuthentication(): void
    {
        $this->assertRequiresAuthentication('GET', '/api/equipment');
    }

    public function testAssociationWithoutEquipmentModuleIsRefused(): void
    {
        $this->signInAssociationMember(['salles']);
        $this->requestJson('GET', '/api/equipment');
        $this->assertResponseStatusCodeSame(403);
    }

    public function testAssociationWithEquipmentModuleSeesTheCatalog(): void
    {
        $this->signInAssociationMember(['materiel']);
        $this->requestJson('GET', '/api/equipment');
        $this->assertResponseIsSuccessful();
        $this->assertSame([], json_decode((string) $this->client->getResponse()->getContent(), true));
    }

    public function testOnlyEquipmentAgentsSeeTheCatalogAmongAgents(): void
    {
        $this->signInAgent(['ROLE_GESTION_SALLE'], 'salle@example.test');
        $this->requestJson('GET', '/api/equipment');
        $this->assertResponseStatusCodeSame(403);

        $this->signInAgent(['ROLE_GESTION_MATERIEL'], 'materiel@example.test');
        $this->requestJson('GET', '/api/equipment');
        $this->assertResponseIsSuccessful();
    }
}
