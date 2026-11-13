<?php

namespace App\Tests\Controller;

use App\Entity\User;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

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

    public function testAdminLoginRejectsSuspendedAccount(): void
    {
        $this->createAdmin('suspended@example.test')->setInactivatedAt(new \DateTimeImmutable());
        $this->em->flush();

        $this->assertAdminLoginForbidden('suspended@example.test');
    }

    public function testAdminLoginRejectsDeletedAccount(): void
    {
        $this->createAdmin('deleted@example.test')->setDeletedAt(new \DateTimeImmutable());
        $this->em->flush();

        $this->assertAdminLoginForbidden('deleted@example.test');
    }

    public function testAdminLoginRejectsUnverifiedAccount(): void
    {
        $this->createAdmin('unverified@example.test')->setIsVerified(false);
        $this->em->flush();

        $this->assertAdminLoginForbidden('unverified@example.test');
    }

    private function createAdmin(string $email): User
    {
        $user = (new User())
            ->setEmail($email)
            ->setNom('Admin')
            ->setPrenom('Test')
            ->setTypeCompte('mairie')
            ->setRoles(['ROLE_ADMIN'])
            ->setIsVerified(true);

        $user->setPassword(
            static::getContainer()
                ->get(UserPasswordHasherInterface::class)
                ->hashPassword($user, 'ValidPassword1')
        );

        $this->em->persist($user);
        $this->em->flush();

        return $user;
    }

    private function assertAdminLoginForbidden(string $email): void
    {
        $this->requestJson('POST', '/api/auth/admin/login', [
            'email' => $email,
            'password' => 'ValidPassword1',
        ]);

        $this->assertResponseStatusCodeSame(403);
        $this->assertJsonContains([
            'message' => 'Accès refusé — un rôle mairie est requis.',
        ]);

        $response = json_decode((string) $this->client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertIsArray($response);
        self::assertArrayNotHasKey('token', $response);
    }
}
