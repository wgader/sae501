<?php

namespace App\Tests\Controller;

final class ExternalEventControllerTest extends ControllerRouteTestCase
{
    public function testExternalEventsRequireAuthentication(): void
    {
        $this->assertRequiresAuthentication('GET', '/api/events/external');
    }

    public function testExternalEventListReturnsItsPaginationContract(): void
    {
        $this->authenticateAsAdmin();
        $this->client->request('GET', '/api/events/external');

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains([
            'page' => 1,
            'itemsPerPage' => 10,
            'totalItems' => 0,
            'items' => [],
        ]);
    }
}
