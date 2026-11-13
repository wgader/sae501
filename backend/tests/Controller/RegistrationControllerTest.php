<?php

namespace App\Tests\Controller;

final class RegistrationControllerTest extends ControllerRouteTestCase
{
    public function testRegistrationRejectsMalformedJson(): void
    {
        $this->client->request('POST', '/api/auth/register/association', [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_ACCEPT' => 'application/json',
        ], '{');
        $this->assertResponseStatusCodeSame(400);
    }

    public function testRegistrationRequiresAcceptanceOfTerms(): void
    {
        $this->requestJson('POST', '/api/auth/register/association', [
            'nomAssociation' => 'Association test',
            'nom' => 'Dupont',
            'prenom' => 'Jean',
            'email' => 'jean.dupont@example.test',
            'cguAccepted' => false,
        ]);
        $this->assertResponseStatusCodeSame(400);
        $this->assertJsonContains(['errors' => ['cguAccepted' => 'Vous devez accepter les CGU.']]);
    }
}
