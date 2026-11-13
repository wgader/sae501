<?php

namespace App\Tests\Controller;

final class AccountActivationControllerTest extends ControllerRouteTestCase
{
    public function testActivationRejectsMissingCredentials(): void
    {
        $this->requestJson('POST', '/api/auth/activate', ['token' => '', 'password' => '']);
        $this->assertResponseStatusCodeSame(400);
    }

    public function testActivationRejectsAnUnknownToken(): void
    {
        $this->requestJson('POST', '/api/auth/activate', [
            'token' => 'unknown-token',
            'password' => 'ValidPassword1',
        ]);
        $this->assertResponseStatusCodeSame(401);
    }
}
