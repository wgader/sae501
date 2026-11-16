<?php

declare(strict_types=1);

namespace App\Tests\Controller;

use App\Entity\User;
use App\DataFixtures\ControllerIntegrationFixtures;
use Doctrine\Common\DataFixtures\Executor\ORMExecutor;
use Doctrine\Common\DataFixtures\FixtureInterface;
use Doctrine\Common\DataFixtures\Loader;
use Doctrine\Common\DataFixtures\Purger\ORMPurger;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

abstract class ControllerRouteTestCase extends WebTestCase
{
    protected KernelBrowser $client;
    protected EntityManagerInterface $em;
    protected JWTTokenManagerInterface $jwtManager;

    protected function setUp(): void
    {
        parent::setUp();

        $this->client = static::createClient();
        $this->em = static::getContainer()->get(EntityManagerInterface::class);
        $this->jwtManager = static::getContainer()->get(JWTTokenManagerInterface::class);

        $schemaTool = new SchemaTool($this->em);
        $metadata = $this->em->getMetadataFactory()->getAllMetadata();
        $schemaTool->dropSchema($metadata);
        $schemaTool->createSchema($metadata);
    }

    protected function requestJson(string $method, string $uri, array $payload = []): void
    {
        $this->client->request($method, $uri, [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_ACCEPT' => 'application/json',
        ], $payload === [] ? null : json_encode($payload, JSON_THROW_ON_ERROR));
    }

    protected function assertJsonContains(array $expected): void
    {
        $actual = json_decode((string) $this->client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        self::assertIsArray($actual);
        $this->assertJsonSubset($expected, $actual);
    }

    private function assertJsonSubset(mixed $expected, mixed $actual, string $path = '$'): void
    {
        if (is_array($expected)) {
            self::assertIsArray($actual, sprintf('Expected an array at %s.', $path));

            if (array_is_list($expected)) {
                foreach ($expected as $index => $expectedItem) {
                    $matched = false;
                    foreach ($actual as $actualItem) {
                        try {
                            $this->assertJsonSubset($expectedItem, $actualItem, $path . '[' . $index . ']');
                            $matched = true;
                            break;
                        } catch (\PHPUnit\Framework\AssertionFailedError) {
                        }
                    }

                    self::assertTrue($matched, sprintf('Expected item %d was not found at %s.', $index, $path));
                }

                return;
            }

            foreach ($expected as $key => $expectedValue) {
                self::assertArrayHasKey($key, $actual, sprintf('Expected key "%s" at %s.', $key, $path));
                $this->assertJsonSubset($expectedValue, $actual[$key], $path . '.' . $key);
            }

            return;
        }

        self::assertSame($expected, $actual, sprintf('Unexpected JSON value at %s.', $path));
    }

    protected function assertRequiresAuthentication(string $method, string $uri): void
    {
        $this->client->request($method, $uri);
        $this->assertResponseStatusCodeSame(401);
    }

    protected function loadFixtures(FixtureInterface ...$fixtures): void
    {
        $loader = new Loader();
        foreach ($fixtures as $fixture) {
            $loader->addFixture($fixture);
        }

        $executor = new ORMExecutor($this->em, new ORMPurger($this->em));
        $executor->execute($loader->getFixtures());
    }

    protected function loadControllerFixtures(): void
    {
        $this->loadFixtures(new ControllerIntegrationFixtures());
    }

    protected function authenticateAsFixtureAdmin(): User
    {
        $user = $this->em->getRepository(User::class)->findOneBy([
            'email' => ControllerIntegrationFixtures::ADMIN_EMAIL,
        ]);

        self::assertInstanceOf(User::class, $user);
        $this->client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer ' . $this->jwtManager->create($user));

        return $user;
    }

    protected function authenticateAsAdmin(string $email = 'admin@example.test'): User
    {
        $user = (new User())
            ->setEmail($email)
            ->setNom('Admin')
            ->setPrenom('Test')
            ->setTypeCompte('mairie')
            ->setRoles(['ROLE_ADMIN'])
            ->setIsVerified(true);

        $this->em->persist($user);
        $this->em->flush();

        $this->client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer ' . $this->jwtManager->create($user));

        return $user;
    }
}
