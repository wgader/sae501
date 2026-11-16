<?php

namespace App\Tests\Controller;

final class EquipmentReservationControllerTest extends ControllerRouteTestCase
{
    public function testEquipmentReservationRequiresAuthentication(): void
    {
        $this->assertRequiresAuthentication('POST', '/api/equipment/reservations');
    }
}
