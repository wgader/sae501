<?php

namespace App\Tests\Controller;

final class DocumentControllerTest extends ControllerRouteTestCase
{
    public function testMissingDocumentReturnsNotFound(): void
    {
        $this->client->request('GET', '/uploads/documents/missing-document.pdf');
        $this->assertResponseStatusCodeSame(404);
    }
}
