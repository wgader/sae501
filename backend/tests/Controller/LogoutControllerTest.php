<?php

namespace App\Tests\Controller;

final class LogoutControllerTest extends ControllerRouteTestCase
{
    public function testLogoutRequiresAuthentication(): void
    {
        $this->client->request('POST', '/api/auth/logout');

        $this->assertResponseStatusCodeSame(401);
    }

    public function testLogoutRevokesTheJwt(): void
    {
        $user = $this->authenticateAsAdmin();
        $token = $this->jwtManager->create($user);

        $this->client->request('POST', '/api/auth/logout', [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer '.$token,
            'HTTP_ACCEPT' => 'application/json',
        ]);

        $this->assertResponseStatusCodeSame(200);
        $this->assertJsonContains([
            'message' => 'Déconnexion réussie.',
        ]);

        $this->client->request('GET', '/api/account/profile', [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer '.$token,
            'HTTP_ACCEPT' => 'application/json',
        ]);

        $this->assertResponseStatusCodeSame(401);
    }

    public function testRevokedJwtStaysRejectedAfterApplicationCacheIsCleared(): void
    {
        $user = $this->authenticateAsAdmin();
        $token = $this->jwtManager->create($user);
        $headers = [
            'HTTP_AUTHORIZATION' => 'Bearer '.$token,
            'HTTP_ACCEPT' => 'application/json',
        ];

        $this->client->request('POST', '/api/auth/logout', [], [], $headers);
        $this->assertResponseStatusCodeSame(200);

        // Un redéploiement repart d’un var/cache vide : la révocation ne doit pas y être stockée.
        static::getContainer()->get('cache.app')->clear();

        $this->client->request('GET', '/api/account/profile', [], [], $headers);

        $this->assertResponseStatusCodeSame(401);
    }
}
