<?php

declare(strict_types=1);

namespace App\Tests\Controller;

use App\Entity\Association;
use App\Entity\DemandeSubvention;
use App\Entity\User;

final class GrantAdministrationControllerTest extends ControllerRouteTestCase
{
    public function testAdministratorListsSubmittedGrantsButNotDrafts(): void
    {
        $association = $this->createAssociation();
        $pending = $this->createGrant($association, 'En attente', 'Festival');
        $this->createGrant($association, 'Brouillon', 'Brouillon privé');
        $this->createGrant($association, 'Validée', 'Ancien projet');
        $this->authenticateAsAdmin();

        $this->requestJson('GET', '/api/admin/grants?status=pending');
        $this->assertResponseIsSuccessful();
        $data = $this->responseData();
        self::assertCount(1, $data['items']);
        self::assertSame('Festival', $data['items'][0]['intituleProjet']);
        self::assertArrayNotHasKey('iban', $data['items'][0]);
        self::assertSame(['all' => 2, 'pending' => 1, 'validated' => 1, 'refused' => 0], $data['counts']);

        $this->requestJson('GET', '/api/admin/grants/'.$pending->getId());
        $this->assertResponseIsSuccessful();
        $this->assertJsonContains(['iban' => 'FR1420041010050500013M02606', 'bic' => 'CMCIFRPP']);

        $draft = $this->em->getRepository(DemandeSubvention::class)->findOneBy(['statut' => 'Brouillon']);
        self::assertInstanceOf(DemandeSubvention::class, $draft);
        $this->requestJson('GET', '/api/admin/grants/'.$draft->getId());
        $this->assertResponseStatusCodeSame(404);
    }

    public function testValidationGrantsRequestedAmountByDefaultAndCannotBeRepeated(): void
    {
        $grant = $this->createGrant($this->createAssociation(), 'En attente', 'Festival');
        $this->authenticateAsAdmin();
        $uri = '/api/admin/grants/'.$grant->getId().'/decision';

        $this->requestJson('PATCH', $uri, ['status' => 'Validée', 'montantAccorde' => '900']);
        $this->assertResponseStatusCodeSame(422);

        $this->requestJson('PATCH', $uri, ['status' => 'Validée', 'message' => 'Bon festival !']);
        $this->assertResponseIsSuccessful();
        $this->assertJsonContains(['statut' => 'Validée', 'montantAccorde' => '500.00', 'observations' => 'Bon festival !']);
        $this->assertEmailCount(1);

        $this->requestJson('PATCH', $uri, ['status' => 'Refusée', 'message' => 'Trop tard']);
        $this->assertResponseStatusCodeSame(409);
    }

    public function testPartialAmountAndRefusalReason(): void
    {
        $association = $this->createAssociation();
        $partial = $this->createGrant($association, 'En attente', 'Partiel');
        $refused = $this->createGrant($association, 'En attente', 'Refus');
        $this->authenticateAsAdmin();

        $this->requestJson('PATCH', '/api/admin/grants/'.$partial->getId().'/decision', ['status' => 'Validée', 'montantAccorde' => '250,50']);
        $this->assertJsonContains(['montantAccorde' => '250.50']);

        $this->requestJson('PATCH', '/api/admin/grants/'.$refused->getId().'/decision', ['status' => 'Refusée']);
        $this->assertResponseStatusCodeSame(422);
        $this->assertJsonContains(['message' => 'Indiquez le motif du refus à l’association.']);

        $this->requestJson('PATCH', '/api/admin/grants/'.$refused->getId().'/decision', ['status' => 'Refusée', 'message' => 'Budget épuisé']);
        $this->assertResponseIsSuccessful();
        $this->assertJsonContains(['statut' => 'Refusée', 'montantAccorde' => null]);
    }

    public function testOnlyGrantAgentsCanInstructGrants(): void
    {
        $grant = $this->createGrant($this->createAssociation(), 'En attente', 'Festival');

        $this->authenticateAsAgent(['ROLE_GESTION_MATERIEL'], 'materiel@example.test');
        $this->requestJson('GET', '/api/admin/grants');
        $this->assertResponseStatusCodeSame(403);

        $this->authenticateAsAgent(['ROLE_GESTION_SUBVENTION'], 'subvention@example.test');
        $this->requestJson('GET', '/api/admin/grants');
        $this->assertResponseIsSuccessful();
        $this->requestJson('PATCH', '/api/admin/grants/'.$grant->getId().'/decision', ['status' => 'Validée']);
        $this->assertResponseIsSuccessful();
    }

    private function createAssociation(): Association
    {
        $association = (new Association())->setNom('Association instruite')->setModuleSubventionActif(true);
        $this->em->persist($association);
        $this->em->persist(
            (new User())
                ->setEmail('contact.instruite@example.test')
                ->setNom('Contact')
                ->setPrenom('Camille')
                ->setTypeCompte('association')
                ->setRoles(['ROLE_ASSOCIATION'])
                ->setIsVerified(true)
                ->setAssociation($association),
        );
        $this->em->flush();

        return $association;
    }

    private function createGrant(Association $association, string $status, string $title): DemandeSubvention
    {
        $grant = (new DemandeSubvention())
            ->setAssociation($association)
            ->setIntituleProjet($title)
            ->setTypeSubvention('Projet')
            ->setMontantDemande('500.00')
            ->setBic('CMCIFRPP')
            ->setIban('FR1420041010050500013M02606')
            ->setStatut($status)
            ->setUpdatedAt(new \DateTimeImmutable());
        $this->em->persist($grant);
        $this->em->flush();

        return $grant;
    }

    /**
     * @param list<string> $roles
     */
    private function authenticateAsAgent(array $roles, string $email): void
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
    }

    /**
     * @return array<string, mixed>
     */
    private function responseData(): array
    {
        $data = json_decode((string) $this->client->getResponse()->getContent(), true);
        self::assertIsArray($data);

        return $data;
    }
}
