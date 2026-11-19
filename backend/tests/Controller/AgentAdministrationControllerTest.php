<?php

namespace App\Tests\Controller;

use App\DataFixtures\ControllerIntegrationFixtures;
use App\Entity\Association;
use App\Entity\User;
use Symfony\Component\Mime\Email;

final class AgentAdministrationControllerTest extends ControllerRouteTestCase
{
    public function testAgentAdministrationRequiresAdminAuthentication(): void
    {
        $this->assertRequiresAuthentication('GET', '/api/admin/agents');
    }

    public function testAgentListReturnsPersistedAgents(): void
    {
        $this->loadControllerFixtures();
        $this->authenticateAsFixtureAdmin();
        $this->client->request('GET', '/api/admin/agents');

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains([
            'items' => [[
                'email' => ControllerIntegrationFixtures::ADMIN_EMAIL,
                'nom' => 'Martin',
            ]],
        ]);
    }

    public function testNewAgentReceivesAnActivationLinkAndChoosesTheirPassword(): void
    {
        $this->authenticateAsAdmin();

        $this->createAgent('camille@example.test', ['ROLE_GESTION_SALLE']);

        $this->assertResponseStatusCodeSame(201);
        $this->assertJsonContains(['invitationSent' => true, 'isVerified' => false]);
        $this->assertEmailCount(1);
        $email = $this->getMailerMessage();
        self::assertInstanceOf(Email::class, $email);
        self::assertSame(1, preg_match('/activer-compte#token=([a-f0-9]{64})&amp;ref=[^&]+&amp;espace=mairie/', (string) $email->getHtmlBody(), $matches));

        $agent = $this->findAgent('camille@example.test');
        self::assertNull($agent->getPassword());
        self::assertSame(hash('sha256', $matches[1]), $agent->getActivationToken());

        $this->client->setServerParameter('HTTP_AUTHORIZATION', '');
        $this->requestJson('POST', '/api/auth/activate', ['token' => $matches[1], 'password' => 'Aa1'.bin2hex(random_bytes(8))]);

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains(['user' => ['typeCompte' => 'mairie']]);
    }

    public function testInvitationCanBeResentOnlyBeforeActivation(): void
    {
        $this->authenticateAsAdmin();
        $this->createAgent('camille@example.test', ['ROLE_GESTION_SALLE']);
        $agent = $this->findAgent('camille@example.test');
        $firstToken = $agent->getActivationToken();

        $this->requestJson('POST', '/api/admin/agents/'.$agent->getId().'/invitation');
        $this->assertResponseIsSuccessful();
        $this->em->clear();
        self::assertNotSame($firstToken, $this->findAgent('camille@example.test')->getActivationToken());

        $activated = $this->findAgent('camille@example.test')->setIsVerified(true);
        $this->em->flush();

        $this->requestJson('POST', '/api/admin/agents/'.$activated->getId().'/invitation');
        $this->assertResponseStatusCodeSame(409);
    }

    public function testNoSecondAdministratorCanBeCreated(): void
    {
        $this->authenticateAsAdmin();

        $this->createAgent('directeur@example.test', ['ROLE_ADMIN', 'ROLE_GESTION_SALLE']);

        $this->assertResponseStatusCodeSame(422);
        self::assertNull($this->em->getRepository(User::class)->findOneBy(['email' => 'directeur@example.test']));
    }

    public function testAgentCannotBePromotedToAdministrator(): void
    {
        $this->authenticateAsAdmin();
        $this->createAgent('camille@example.test', ['ROLE_GESTION_SALLE']);
        $agent = $this->findAgent('camille@example.test');

        $this->requestJson('PATCH', '/api/admin/agents/'.$agent->getId(), ['roles' => ['ROLE_ADMIN']]);

        $this->assertResponseStatusCodeSame(422);
        $this->em->clear();
        self::assertNotContains('ROLE_ADMIN', $this->findAgent('camille@example.test')->getRoles());
    }

    public function testUserResourceCannotBeUsedToGrantAdministrator(): void
    {
        $admin = $this->authenticateAsAdmin();

        $this->requestJson('POST', '/api/users', ['email' => 'intrus@example.test', 'roles' => ['ROLE_ADMIN']]);
        $this->assertResponseStatusCodeSame(405);

        $this->client->request('DELETE', '/api/users/'.$admin->getId());
        $this->assertResponseStatusCodeSame(405);
    }

    public function testAgentCanReceiveEveryModuleWithoutBecomingAdministrator(): void
    {
        $this->authenticateAsAdmin();

        $this->createAgent('camille@example.test', ['ROLE_GESTION_EVENT', 'ROLE_GESTION_SUBVENTION', 'ROLE_GESTION_MATERIEL', 'ROLE_GESTION_SALLE']);

        $this->assertResponseStatusCodeSame(201);
        self::assertNotContains('ROLE_ADMIN', $this->findAgent('camille@example.test')->getRoles());
    }

    public function testAdministratorKeepsTheirRoleWhenEditingTheirProfile(): void
    {
        $admin = $this->authenticateAsAdmin();

        $this->requestJson('PATCH', '/api/admin/agents/'.$admin->getId(), ['prenom' => 'Alex', 'roles' => ['ROLE_ADMIN']]);

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains(['prenom' => 'Alex', 'roles' => ['ROLE_ADMIN']]);
    }

    public function testAgentNeedsAtLeastOneModule(): void
    {
        $this->authenticateAsAdmin();

        $this->createAgent('camille@example.test', []);

        $this->assertResponseStatusCodeSame(422);
    }

    public function testAdministratorCannotRemoveTheirOwnRights(): void
    {
        $admin = $this->authenticateAsAdmin();
        $this->persistSurplusAdministrator();

        $this->requestJson('PATCH', '/api/admin/agents/'.$admin->getId(), ['roles' => ['ROLE_GESTION_SALLE']]);

        $this->assertResponseStatusCodeSame(422);
        $this->em->clear();
        self::assertContains('ROLE_ADMIN', $this->findAgent('admin@example.test')->getRoles());
    }

    public function testSurplusAdministratorCanBeDemoted(): void
    {
        $this->authenticateAsAdmin();
        $second = $this->persistSurplusAdministrator();

        $this->requestJson('PATCH', '/api/admin/agents/'.$second->getId(), ['roles' => ['ROLE_GESTION_SALLE']]);

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains(['roles' => ['ROLE_GESTION_SALLE']]);
    }

    public function testModuleAgentCannotManageAgents(): void
    {
        $agent = (new User())
            ->setEmail('salle@example.test')
            ->setNom('Agent')
            ->setPrenom('Salle')
            ->setTypeCompte('mairie')
            ->setRoles(['ROLE_GESTION_SALLE'])
            ->setIsVerified(true);
        $this->em->persist($agent);
        $this->em->flush();
        $this->client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer '.$this->jwtManager->create($agent));

        $this->createAgent('intrus@example.test', ['ROLE_ADMIN']);

        $this->assertResponseStatusCodeSame(403);
    }

    public function testAgentOnlyReachesTheRoutesOfTheirModule(): void
    {
        $this->authenticateModuleAgent('ROLE_GESTION_MATERIEL');

        foreach (['/api/admin/equipment' => 200, '/api/admin/equipment/reservations' => 200, '/api/admin/salles' => 403, '/api/admin/room-requests' => 403, '/api/admin/agents' => 403, '/api/admin/associations' => 403] as $uri => $status) {
            $this->client->request('GET', $uri);
            $this->assertResponseStatusCodeSame($status, $uri);
        }
    }

    public function testRoomAgentReachesRoomRoutes(): void
    {
        $this->authenticateModuleAgent('ROLE_GESTION_SALLE');

        foreach (['/api/admin/salles' => 200, '/api/admin/room-requests' => 200, '/api/admin/equipment' => 403] as $uri => $status) {
            $this->client->request('GET', $uri);
            $this->assertResponseStatusCodeSame($status, $uri);
        }
    }

    public function testAgentCannotRequestDocumentsOutsideTheirModule(): void
    {
        $this->authenticateModuleAgent('ROLE_GESTION_MATERIEL');

        $association = (new Association())->setNom('Club')->setStatut('VALIDATED');
        $this->em->persist($association);
        $this->em->flush();

        $this->requestJson('POST', '/api/admin/associations/'.$association->getId().'/requests/1/request-documents', [
            'type' => 'salle',
            'missingFiles' => ['Assurance'],
            'message' => 'Merci de transmettre cette pièce.',
        ]);

        $this->assertResponseStatusCodeSame(403);
    }

    public function testAdministratorInheritsEveryModule(): void
    {
        $this->authenticateAsAdmin();

        foreach (['/api/admin/equipment', '/api/admin/salles', '/api/admin/room-requests', '/api/admin/agents'] as $uri) {
            $this->client->request('GET', $uri);
            $this->assertResponseIsSuccessful($uri);
        }
    }

    /** Compte créé avant la règle de l'administrateur unique. */
    private function persistSurplusAdministrator(): User
    {
        $administrator = (new User())
            ->setEmail('second@example.test')
            ->setNom('Admin')
            ->setPrenom('Second')
            ->setTypeCompte('mairie')
            ->setRoles(['ROLE_ADMIN'])
            ->setIsVerified(true);
        $this->em->persist($administrator);
        $this->em->flush();

        return $administrator;
    }

    private function authenticateModuleAgent(string $role): void
    {
        $agent = (new User())
            ->setEmail('module@example.test')
            ->setNom('Agent')
            ->setPrenom('Module')
            ->setTypeCompte('mairie')
            ->setRoles([$role])
            ->setIsVerified(true);
        $this->em->persist($agent);
        $this->em->flush();
        $this->client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer '.$this->jwtManager->create($agent));
    }

    /**
     * @param list<string> $roles
     */
    private function createAgent(string $email, array $roles): void
    {
        $this->requestJson('POST', '/api/admin/agents', [
            'nom' => 'Dupont',
            'prenom' => 'Camille',
            'email' => $email,
            'roles' => $roles,
        ]);
    }

    private function findAgent(string $email): User
    {
        $agent = $this->em->getRepository(User::class)->findOneBy(['email' => $email]);
        self::assertInstanceOf(User::class, $agent);

        return $agent;
    }
}
