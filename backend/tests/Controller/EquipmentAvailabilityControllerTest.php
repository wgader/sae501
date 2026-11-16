<?php

namespace App\Tests\Controller;

final class EquipmentAvailabilityControllerTest extends ControllerRouteTestCase
{
    public function testEquipmentAvailabilityRequiresAssociationAuthentication(): void
    {
        $this->assertRequiresAuthentication('GET', '/api/equipment/availability?start=2026-01-01&end=2026-01-02');
    }
}
