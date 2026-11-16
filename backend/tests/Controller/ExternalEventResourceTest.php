<?php

namespace App\Tests\Controller;

final class ExternalEventResourceTest extends ControllerRouteTestCase
{
    public function testExternalEventCollectionRequiresAuthentication(): void
    {
        $this->assertRequiresAuthentication('GET', '/api/external_events');
    }
}
