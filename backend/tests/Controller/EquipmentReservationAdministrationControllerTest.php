<?php

namespace App\Tests\Controller;

final class EquipmentReservationAdministrationControllerTest extends ControllerRouteTestCase
{
    public function testReservationAdministrationRequiresAdminAuthentication(): void
    {
        $this->assertRequiresAuthentication('GET', '/api/admin/equipment/reservations');
    }

    public function testReservationListReturnsItsPaginationContract(): void
    {
        $this->authenticateAsAdmin();
        $this->client->request('GET', '/api/admin/equipment/reservations');

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains([
            'page' => 1,
            'itemsPerPage' => 10,
            'totalItems' => 0,
            'items' => [],
        ]);
    }
}
