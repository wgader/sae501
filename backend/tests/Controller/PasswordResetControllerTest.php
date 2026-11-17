<?php

declare(strict_types=1);

namespace App\Tests\Controller;

use App\Entity\User;
use Symfony\Component\Mime\Email;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Mot de passe oublié : réponse identique que le compte existe ou non, lien à usage unique et
 * limité dans le temps, sessions précédentes invalidées.
 */
final class PasswordResetControllerTest extends ControllerRouteTestCase
{
    private const GENERIC = 'Si un compte actif correspond à cette adresse, un lien de réinitialisation vient de lui être envoyé.';

    protected function setUp(): void
    {
        parent::setUp();
        // Les compteurs du limiteur vivent en mémoire : le noyau ne doit pas redémarrer entre deux requêtes.
        $this->client->disableReboot();
    }

    public function testUnknownEmailGetsTheSameAnswerWithoutEmail(): void
    {
        $this->requestJson('POST', '/api/auth/password-reset/request', ['email' => 'inconnu@example.test']);

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains(['message' => self::GENERIC]);
        self::assertEmailCount(0);
    }

    public function testSuspendedAccountReceivesNoLink(): void
    {
        $this->createUser('suspendu@example.test')->setInactivatedAt(new \DateTimeImmutable());
        $this->em->flush();

        $this->requestJson('POST', '/api/auth/password-reset/request', ['email' => 'suspendu@example.test']);

        $this->assertJsonContains(['message' => self::GENERIC]);
        self::assertEmailCount(0);
    }

    public function testResetChangesThePasswordOnceAndClosesOldSessions(): void
    {
        $user = $this->createUser('asso@example.test');
        $oldToken = $this->jwtManager->create($user);
        // Le JWT existant doit être strictement antérieur au changement de mot de passe.
        sleep(1);

        $this->requestJson('POST', '/api/auth/password-reset/request', ['email' => 'asso@example.test']);
        $this->assertJsonContains(['message' => self::GENERIC]);
        self::assertEmailCount(1);
        $resetToken = $this->tokenFromEmail();
        $this->em->refresh($user);
        self::assertNotSame($resetToken, $user->getPasswordResetTokenHash(), 'Seule l’empreinte du jeton est stockée.');

        $this->requestJson('POST', '/api/auth/password-reset/confirm', ['token' => $resetToken, 'password' => 'faible']);
        $this->assertResponseStatusCodeSame(422);

        $newPassword = self::randomPassword();
        $this->requestJson('POST', '/api/auth/password-reset/confirm', ['token' => $resetToken, 'password' => $newPassword]);
        $this->assertResponseIsSuccessful();
        $this->assertJsonContains(['loginPath' => '/connexion']);

        $this->requestJson('POST', '/api/auth/password-reset/confirm', ['token' => $resetToken, 'password' => self::randomPassword()]);
        $this->assertResponseStatusCodeSame(401);

        $this->client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer '.$oldToken);
        $this->client->request('GET', '/api/campaigns/current');
        $this->assertResponseStatusCodeSame(401);

        $this->client->setServerParameter('HTTP_AUTHORIZATION', '');
        $this->requestJson('POST', '/api/auth/login', ['email' => 'asso@example.test', 'password' => $newPassword]);
        $this->assertResponseIsSuccessful();
    }

    public function testExpiredLinkIsRefused(): void
    {
        $user = $this->createUser('asso@example.test');
        $user->startPasswordReset(hash('sha256', 'jeton-expire'), new \DateTimeImmutable('-1 minute'));
        $this->em->flush();

        $this->requestJson('POST', '/api/auth/password-reset/confirm', ['token' => 'jeton-expire', 'password' => self::randomPassword()]);

        $this->assertResponseStatusCodeSame(401);
    }

    public function testRequestsAreRateLimited(): void
    {
        for ($attempt = 1; $attempt <= 5; ++$attempt) {
            $this->requestJson('POST', '/api/auth/password-reset/request', ['email' => 'inconnu@example.test']);
            $this->assertResponseIsSuccessful();
        }

        $this->requestJson('POST', '/api/auth/password-reset/request', ['email' => 'inconnu@example.test']);

        $this->assertResponseStatusCodeSame(429);
        self::assertTrue($this->client->getResponse()->headers->has('Retry-After'));
    }

    private function createUser(string $email): User
    {
        $user = (new User())
            ->setEmail($email)
            ->setNom('Test')
            ->setPrenom('Compte')
            ->setTypeCompte('association')
            ->setRoles(['ROLE_ASSOCIATION'])
            ->setIsVerified(true);
        $hasher = static::getContainer()->get(UserPasswordHasherInterface::class);
        $user->setPassword($hasher->hashPassword($user, self::randomPassword()));
        $this->em->persist($user);
        $this->em->flush();

        return $user;
    }

    private function tokenFromEmail(): string
    {
        $message = self::getMailerMessage();
        self::assertInstanceOf(Email::class, $message);
        self::assertSame(1, preg_match('/reinitialiser-mot-de-passe#token=([a-f0-9]{64})/', (string) $message->getHtmlBody(), $matches));

        return $matches[1];
    }

    /** Mot de passe de test tiré au hasard : aucun mot de passe n’est écrit en dur. */
    private static function randomPassword(): string
    {
        return 'Aa1'.bin2hex(random_bytes(8));
    }
}
