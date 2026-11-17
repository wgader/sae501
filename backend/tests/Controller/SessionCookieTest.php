<?php

declare(strict_types=1);

namespace App\Tests\Controller;

use App\Entity\User;
use App\Security\SessionCookie;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Session par cookie HttpOnly : le JWT n’apparaît jamais dans le corps, les appels qui modifient
 * des données exigent l’en-tête X-Requested-With, et la déconnexion efface le cookie.
 */
final class SessionCookieTest extends ControllerRouteTestCase
{
    private string $password;

    protected function setUp(): void
    {
        parent::setUp();
        // Tiré au hasard : aucun mot de passe n’est écrit en dur dans le dépôt.
        $this->password = 'Aa1'.bin2hex(random_bytes(8));
    }

    public function testAssociationLoginSetsAnHttpOnlyCookieWithoutTokenInBody(): void
    {
        $this->createUser('asso@example.test', 'association', ['ROLE_ASSOCIATION']);

        $this->requestJson('POST', '/api/auth/login', ['email' => 'asso@example.test', 'password' => $this->password]);

        $this->assertResponseIsSuccessful();
        $this->assertSessionCookieIsSafe();
        $body = (string) $this->client->getResponse()->getContent();
        self::assertStringNotContainsString('"token"', $body);
        $this->assertJsonContains(['user' => ['email' => 'asso@example.test', 'typeCompte' => 'association']]);
    }

    public function testAdminLoginSetsTheCookieAndTheSessionEndpointUsesIt(): void
    {
        $this->createUser('agent@example.test', 'mairie', ['ROLE_ADMIN']);

        $this->requestJson('POST', '/api/auth/admin/login', ['email' => 'agent@example.test', 'password' => $this->password]);
        $this->assertResponseIsSuccessful();
        $this->assertSessionCookieIsSafe();
        self::assertStringNotContainsString('"token"', (string) $this->client->getResponse()->getContent());

        // Le navigateur renvoie le cookie : aucune en-tête Authorization nécessaire.
        $this->client->request('GET', '/api/auth/session');
        $this->assertResponseIsSuccessful();
        $this->assertJsonContains(['user' => ['email' => 'agent@example.test']]);
    }

    public function testStateChangingRequestWithCookieRequiresTheCsrfHeader(): void
    {
        $this->createUser('agent@example.test', 'mairie', ['ROLE_ADMIN']);
        $this->requestJson('POST', '/api/auth/admin/login', ['email' => 'agent@example.test', 'password' => $this->password]);

        // Un formulaire piégé sur un autre site enverrait le cookie, mais pas l’en-tête.
        $this->client->request('POST', '/api/auth/logout');
        $this->assertResponseStatusCodeSame(403);

        $this->requestJson('POST', '/api/auth/logout');
        $this->assertResponseIsSuccessful();
        $cleared = $this->client->getResponse()->headers->getCookies()[0] ?? null;
        self::assertSame(SessionCookie::NAME, $cleared?->getName());
        self::assertTrue($cleared->isCleared());

        // Le jeton révoqué ne rouvre plus la session.
        $this->client->getCookieJar()->clear();
        $this->client->request('GET', '/api/auth/session');
        $this->assertResponseStatusCodeSame(401);
    }

    public function testDeletedAccountLoginLooksLikeWrongCredentialsAndLosesItsSession(): void
    {
        $user = $this->createUser('asso@example.test', 'association', ['ROLE_ASSOCIATION']);
        $token = $this->jwtManager->create($user);
        $user->setDeletedAt(new \DateTimeImmutable());
        $this->em->flush();

        // Même message qu’un mauvais mot de passe : rien ne révèle que le compte a existé.
        $this->requestJson('POST', '/api/auth/login', ['email' => 'asso@example.test', 'password' => $this->password]);
        $this->assertResponseStatusCodeSame(403);
        $this->assertJsonContains(['message' => 'Identifiants incorrects.']);
        self::assertSame([], $this->client->getResponse()->headers->getCookies());

        $this->client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer '.$token);
        $this->client->request('GET', '/api/auth/session');
        $this->assertResponseStatusCodeSame(401);
    }

    public function testNotActivatedAccountGetsNoCookie(): void
    {
        $user = $this->createUser('asso@example.test', 'association', ['ROLE_ASSOCIATION']);
        $user->setIsVerified(false);
        $this->em->flush();

        $this->requestJson('POST', '/api/auth/login', ['email' => 'asso@example.test', 'password' => $this->password]);
        $this->assertResponseStatusCodeSame(403);
        $this->assertJsonContains(['message' => 'Votre compte n’est pas encore activé.']);
        self::assertSame([], $this->client->getResponse()->headers->getCookies());
    }

    public function testSuspendedAccountGetsNoCookieAndLosesItsSession(): void
    {
        $user = $this->createUser('asso@example.test', 'association', ['ROLE_ASSOCIATION']);
        $token = $this->jwtManager->create($user);
        $user->setInactivatedAt(new \DateTimeImmutable());
        $this->em->flush();

        $this->requestJson('POST', '/api/auth/login', ['email' => 'asso@example.test', 'password' => $this->password]);
        $this->assertResponseStatusCodeSame(403);
        $this->assertJsonContains(['message' => 'Votre compte a été suspendu. Contactez la mairie.']);
        self::assertSame([], $this->client->getResponse()->headers->getCookies());

        // Un jeton émis avant la suspension est refusé immédiatement.
        $this->client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer '.$token);
        $this->client->request('GET', '/api/auth/session');
        $this->assertResponseStatusCodeSame(401);
    }

    private function assertSessionCookieIsSafe(): void
    {
        $cookies = $this->client->getResponse()->headers->getCookies();
        self::assertCount(1, $cookies);
        self::assertSame(SessionCookie::NAME, $cookies[0]->getName());
        self::assertTrue($cookies[0]->isHttpOnly());
        self::assertSame('strict', $cookies[0]->getSameSite());
    }

    /**
     * @param list<string> $roles
     */
    private function createUser(string $email, string $type, array $roles): User
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
