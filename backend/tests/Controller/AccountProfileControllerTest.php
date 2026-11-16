<?php

namespace App\Tests\Controller;

final class AccountProfileControllerTest extends ControllerRouteTestCase
{
    public function testProfileRequiresAuthentication(): void
    {
        $this->assertRequiresAuthentication('GET', '/api/account/profile');
    }

    public function testProfileReturnsTheAuthenticatedUser(): void
    {
        $user = $this->authenticateAsAdmin('profile@example.test');
        $this->client->request('GET', '/api/account/profile');

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains([
            'email' => $user->getEmail(),
            'nom' => 'Admin',
            'prenom' => 'Test',
        ]);
    }
}
