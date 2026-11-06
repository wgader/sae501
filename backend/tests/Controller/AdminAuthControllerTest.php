<?php

namespace App\Tests\Controller;

final class AdminAuthControllerTest extends ControllerRouteTestCase
{
    public function testAdminLoginRejectsMissingCredentials(): void
    {
        $this->requestJson('POST', '/api/auth/admin/login');
        $this->assertResponseStatusCodeSame(400);
    }

    public function testAdminLoginRejectsUnknownCredentials(): void
    {
        $this->requestJson('POST', '/api/auth/admin/login', [
            'email' => 'unknown@example.test',
            'password' => 'WrongPassword1',
        ]);
        $this->assertResponseStatusCodeSame(401);
    }
}
