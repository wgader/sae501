<?php

namespace App\Tests\Controller;

final class ExternalEventFileResourceTest extends ControllerRouteTestCase
{
    public function testExternalEventFileCollectionRequiresAuthentication(): void
    {
        $this->assertRequiresAuthentication('GET', '/api/external_event_files');
    }
}
