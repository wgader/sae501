<?php

declare(strict_types=1);

namespace App\Tests\Controller;

use App\DataFixtures\ControllerIntegrationFixtures;
use App\Entity\Association;
use App\Entity\User;
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

        // Compteurs de tentatives (connexion, inscription…) remis à zéro : chaque test part d’un état neutre.
        static::getContainer()->get('cache.rate_limiter')->clear();

        $schemaTool = new SchemaTool($this->em);
        $metadata = $this->em->getMetadataFactory()->getAllMetadata();
        $schemaTool->dropSchema($metadata);
        $schemaTool->createSchema($metadata);
    }

    protected function requestJson(string $method, string $uri, array $payload = []): void
    {
        // Comme le frontend, les requêtes portent l’en-tête exigé par la protection CSRF.
        $this->client->request($method, $uri, [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_ACCEPT' => 'application/json',
            'HTTP_X_REQUESTED_WITH' => 'XMLHttpRequest',
        ], [] === $payload ? null : json_encode($payload, JSON_THROW_ON_ERROR));
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
                            $this->assertJsonSubset($expectedItem, $actualItem, $path.'['.$index.']');
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
                $this->assertJsonSubset($expectedValue, $actual[$key], $path.'.'.$key);
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
        $this->client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer '.$this->jwtManager->create($user));

        return $user;
    }

    /**
     * Connecte un membre d'une nouvelle association dont seuls les modules indiqués sont actifs.
     *
     * @param list<'salles'|'materiel'|'subventions'|'evenements'> $modules
     */
    protected function signInAssociationMember(array $modules, string $email = 'membre@example.test'): User
    {
        $association = (new Association())
            ->setNom('Association '.$email)
            ->setStatut('VALIDATED')
            ->setModuleSalleActif(in_array('salles', $modules, true))
            ->setModuleMaterielActif(in_array('materiel', $modules, true))
            ->setModuleSubventionActif(in_array('subventions', $modules, true))
            ->setModuleEvenementActif(in_array('evenements', $modules, true));
        $user = (new User())
            ->setEmail($email)
            ->setNom('Membre')
            ->setPrenom('Test')
            ->setTypeCompte('association')
            ->setRoles(['ROLE_ASSOCIATION'])
            ->setIsVerified(true)
            ->setAssociation($association);
        $this->em->persist($association);
        $this->em->persist($user);
        $this->em->flush();
        $this->client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer '.$this->jwtManager->create($user));

        return $user;
    }

    /**
     * @param list<string> $roles
     */
    protected function signInAgent(array $roles, string $email = 'agent@example.test'): User
    {
        $agent = (new User())
            ->setEmail($email)
            ->setNom('Agent')
            ->setPrenom('Test')
            ->setTypeCompte('mairie')
            ->setRoles($roles)
            ->setIsVerified(true);
        $this->em->persist($agent);
        $this->em->flush();
        $this->client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer '.$this->jwtManager->create($agent));

        return $agent;
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

        $this->client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer '.$this->jwtManager->create($user));

        return $user;
    }
}
