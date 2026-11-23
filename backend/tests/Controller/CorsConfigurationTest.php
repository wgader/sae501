<?php

declare(strict_types=1);

namespace App\Tests\Controller;

/**
 * Le CORS est géré par nelmio_cors à partir de CORS_ALLOW_ORIGIN : seules les origines
 * autorisées reçoivent les en-têtes qui permettent au navigateur d’appeler l’API.
 */
final class CorsConfigurationTest extends ControllerRouteTestCase
{
    public function testAllowedOriginReceivesPreflightHeaders(): void
    {
        $this->preflight('http://localhost:3000');

        $this->assertResponseHeaderSame('Access-Control-Allow-Origin', 'http://localhost:3000');
        self::assertStringContainsString('POST', (string) $this->client->getResponse()->headers->get('Access-Control-Allow-Methods'));
    }

    public function testUnknownOriginReceivesNoCorsHeader(): void
    {
        $this->preflight('https://site-malveillant.example');

        $this->assertResponseNotHasHeader('Access-Control-Allow-Origin');
    }

    public function testOriginThatOnlyStartsLikeAnAllowedOneIsRejected(): void
    {
        $this->preflight('http://localhost.site-malveillant.example');

        $this->assertResponseNotHasHeader('Access-Control-Allow-Origin');
    }

    private function preflight(string $origin): void
    {
        $this->client->request('OPTIONS', '/api/auth/login', [], [], [
            'HTTP_ORIGIN' => $origin,
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
            'HTTP_ACCESS_CONTROL_REQUEST_HEADERS' => 'content-type',
        ]);
    }
}
