<?php

namespace App\Tests\Controller;

use App\Entity\Association;
use App\Entity\User;

final class AccountActivationControllerTest extends ControllerRouteTestCase
{
    public function testActivationAndResendShareAnIpRateLimit(): void
    {
        for ($attempt = 1; $attempt <= 5; ++$attempt) {
            $this->requestJson('POST', '/api/auth/activate', ['token' => 'jeton-inconnu', 'password' => 'x']);
            $this->assertResponseStatusCodeSame(401);
            $this->requestJson('POST', '/api/auth/resend-activation', ['email' => 'inconnu@example.test']);
            $this->assertResponseIsSuccessful();
        }

        $this->requestJson('POST', '/api/auth/resend-activation', ['email' => 'inconnu@example.test']);

        $this->assertResponseStatusCodeSame(429);
        self::assertTrue($this->client->getResponse()->headers->has('Retry-After'));
    }

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

    public function testActivationLinkWorksOnceAndOnlyItsHashIsStored(): void
    {
        $association = (new Association())->setNom('Club de lecture')->setStatut('VALIDATED');
        $user = (new User())
            ->setEmail('nouveau@example.test')
            ->setNom('Nouveau')
            ->setPrenom('Membre')
            ->setTypeCompte('association')
            ->setRoles(['ROLE_ASSOCIATION'])
            ->setActivationToken('jeton-envoye-par-email')
            ->setActivationTokenExpiresAt(new \DateTimeImmutable('+1 day'));
        $association->addUser($user);
        $this->em->persist($association);
        $this->em->persist($user);
        $this->em->flush();
        self::assertSame(hash('sha256', 'jeton-envoye-par-email'), $user->getActivationToken());

        $password = 'Aa1'.bin2hex(random_bytes(8));
        $this->requestJson('POST', '/api/auth/activate', ['token' => 'jeton-envoye-par-email', 'password' => $password]);
        $this->assertResponseIsSuccessful();

        $this->requestJson('POST', '/api/auth/activate', ['token' => 'jeton-envoye-par-email', 'password' => $password]);
        $this->assertResponseStatusCodeSame(401);
    }
}
