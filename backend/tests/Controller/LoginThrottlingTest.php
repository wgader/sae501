<?php

declare(strict_types=1);

namespace App\Tests\Controller;

use App\Entity\User;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Limitation des tentatives de connexion (association et mairie) contre le test massif de mots de passe.
 */
final class LoginThrottlingTest extends ControllerRouteTestCase
{
    private string $password;

    protected function setUp(): void
    {
        parent::setUp();
        // Les compteurs vivent en mémoire pendant le test : le noyau ne doit pas redémarrer entre deux requêtes.
        $this->client->disableReboot();
        $this->password = 'Aa1'.bin2hex(random_bytes(8));
    }

    public function testAssociationLoginIsThrottledAfterFiveFailures(): void
    {
        $this->createUser('asso@example.test', ['ROLE_ASSOCIATION'], 'association');

        for ($attempt = 1; $attempt <= 5; ++$attempt) {
            $this->requestJson('POST', '/api/auth/login', ['email' => 'asso@example.test', 'password' => 'mauvais']);
            $this->assertResponseStatusCodeSame(401);
        }

        // Même le bon mot de passe est refusé tant que la limite est atteinte.
        $this->requestJson('POST', '/api/auth/login', ['email' => 'asso@example.test', 'password' => $this->password]);

        $this->assertResponseStatusCodeSame(429);
        $this->assertResponseHeaderSame('Retry-After', '900');
        $this->assertJsonContains(['message' => 'Trop de tentatives de connexion. Réessayez dans 15 minutes.']);
        self::assertStringNotContainsString('token', (string) $this->client->getResponse()->getContent());
    }

    public function testAdminLoginIsThrottledAfterFiveFailures(): void
    {
        $this->createUser('agent@example.test', ['ROLE_ADMIN'], 'mairie');

        for ($attempt = 1; $attempt <= 5; ++$attempt) {
            $this->requestJson('POST', '/api/auth/admin/login', ['email' => 'agent@example.test', 'password' => 'mauvais']);
            $this->assertResponseStatusCodeSame(401);
        }

        $this->requestJson('POST', '/api/auth/admin/login', ['email' => 'agent@example.test', 'password' => $this->password]);

        $this->assertResponseStatusCodeSame(429);
        $this->assertResponseHeaderSame('Retry-After', '900');
        self::assertStringNotContainsString('token', (string) $this->client->getResponse()->getContent());
    }

    public function testSuccessfulAdminLoginResetsTheAccountCounter(): void
    {
        $this->createUser('agent@example.test', ['ROLE_ADMIN'], 'mairie');

        for ($attempt = 1; $attempt <= 4; ++$attempt) {
            $this->requestJson('POST', '/api/auth/admin/login', ['email' => 'agent@example.test', 'password' => 'mauvais']);
        }
        $this->requestJson('POST', '/api/auth/admin/login', ['email' => 'agent@example.test', 'password' => $this->password]);
        $this->assertResponseIsSuccessful();

        $this->requestJson('POST', '/api/auth/admin/login', ['email' => 'agent@example.test', 'password' => 'mauvais']);
        $this->assertResponseStatusCodeSame(401);
    }

    public function testRoomReservationsAreNotExposedThroughTheGenericApi(): void
    {
        $user = $this->createUser('asso@example.test', ['ROLE_ASSOCIATION'], 'association');
        $this->client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer '.$this->jwtManager->create($user));

        foreach (['GET', 'DELETE', 'PATCH', 'PUT'] as $method) {
            $this->client->request($method, '/api/reservation_salles/1');
            self::assertSame(404, $this->client->getResponse()->getStatusCode(), $method);
        }
    }

    /**
     * @param list<string> $roles
     */
    private function createUser(string $email, array $roles, string $type): User
    {
        $user = (new User())
            ->setEmail($email)
            ->setNom('Test')
            ->setPrenom('Compte')
            ->setTypeCompte($type)
            ->setRoles($roles)
            ->setIsVerified(true);
        $hasher = static::getContainer()->get(UserPasswordHasherInterface::class);
        $user->setPassword($hasher->hashPassword($user, $this->password));
        $this->em->persist($user);
        $this->em->flush();

        return $user;
    }
}
