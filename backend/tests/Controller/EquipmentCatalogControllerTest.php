<?php

namespace App\Tests\Controller;

final class EquipmentCatalogControllerTest extends ControllerRouteTestCase
{
    public function testCatalogReturnsAnEmptyCollectionWhenNoEquipmentExists(): void
    {
        $this->client->request('GET', '/api/equipment');
        $this->assertResponseIsSuccessful();
        $this->assertSame([], json_decode((string) $this->client->getResponse()->getContent(), true));
    }
}
