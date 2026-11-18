<?php

declare(strict_types=1);

namespace App\Tests\Controller;

use App\Entity\Association;
use App\Entity\DocumentJustificatif;
use App\Entity\User;
use App\Tests\Fixtures\UploadFixtures;
use Symfony\Component\Filesystem\Filesystem;
use Symfony\Component\HttpFoundation\File\UploadedFile;

final class SubventionDraftControllerTest extends ControllerRouteTestCase
{
    private UploadFixtures $fixtures;
    private string $storageDirectory;

    protected function setUp(): void
    {
        parent::setUp();

        $this->fixtures = new UploadFixtures();
        $storageDirectory = static::getContainer()->getParameter('app.private_document_directory');
        self::assertIsString($storageDirectory);
        $this->storageDirectory = $storageDirectory;
        (new Filesystem())->remove($this->storageDirectory);
    }

    protected function tearDown(): void
    {
        $this->fixtures->remove();
        (new Filesystem())->remove($this->storageDirectory);

        parent::tearDown();
    }

    public function testAssociationCanSaveAndResumeAnUnbalancedDraft(): void
    {
        $association = $this->createAssociation('Association brouillon');
        $this->authenticateAsMember($association);

        $this->requestJson('POST', '/api/grants', $this->projectPayload([
            $this->line('depense', 'achats', 'Matériel', '150.00'),
            $this->line('depense', 'logistique', 'Transport', ''),
            $this->line('recette', 'subvention_mairie', 'Subvention mairie', '100.00'),
        ]));

        $this->assertResponseStatusCodeSame(201);
        $draft = $this->responseData();
        self::assertSame('Brouillon', $draft['statut']);
        self::assertFalse($draft['budgetValide']);
        $draftId = $draft['id'];

        $this->requestJson('GET', '/api/grants/drafts');
        $this->assertResponseIsSuccessful();
        $drafts = $this->responseData();
        self::assertCount(1, $drafts);
        self::assertSame($draftId, $drafts[0]['id']);
        self::assertSame('CMCIFRPP', $drafts[0]['bic']);
        self::assertSame('FR1420041010050500013M02606', $drafts[0]['iban']);
        self::assertSame('150.00', $drafts[0]['lignesBudget'][0]['montant']);
        self::assertSame('0.00', $drafts[0]['lignesBudget'][1]['montant']);
    }

    public function testNewDraftCanStartWithoutBankDetails(): void
    {
        $this->authenticateAsMember($this->createAssociation('Association sans RIB'));

        $this->requestJson('POST', '/api/grants', ['intituleProjet' => 'Demande de subvention', 'bic' => '', 'iban' => '']);

        $this->assertResponseStatusCodeSame(201);
        $draft = $this->responseData();
        self::assertNull($draft['bic']);
        self::assertNull($draft['iban']);
    }

    public function testFilledBankDetailsMustStayValid(): void
    {
        $this->authenticateAsMember($this->createAssociation('Association RIB invalide'));

        foreach ([['bic' => 'ABC'], ['iban' => 'FR00']] as $bankDetails) {
            $this->requestJson('POST', '/api/grants', ['intituleProjet' => 'Demande de subvention', ...$bankDetails]);

            $this->assertResponseStatusCodeSame(422);
        }
    }

    public function testBalancedBudgetAndPositiveMunicipalGrantAreValidated(): void
    {
        $association = $this->createAssociation('Association budget équilibré');
        $this->authenticateAsMember($association);

        $this->requestJson('POST', '/api/grants', $this->projectPayload([
            $this->line('depense', 'achats', 'Matériel', '100.00'),
            $this->line('recette', 'cotisations', 'Cotisations', '50.00'),
            $this->line('recette', 'subvention_mairie', 'Subvention mairie', '50.00'),
        ]));
        $this->assertResponseStatusCodeSame(201);
        $draftId = $this->responseData()['id'];

        $this->requestJson('POST', '/api/grants/'.$draftId.'/validate-budget');
        $this->assertResponseIsSuccessful();
        $validated = $this->responseData();
        self::assertSame('Brouillon', $validated['statut']);
        self::assertTrue($validated['budgetValide']);
    }

    public function testUnbalancedAndNonPositiveBudgetsAreRejected(): void
    {
        $association = $this->createAssociation('Association budget invalide');
        $this->authenticateAsMember($association);
        $payload = $this->projectPayload([
            $this->line('depense', 'achats', 'Matériel', '100.00'),
            $this->line('recette', 'subvention_mairie', 'Subvention mairie', '50.00'),
        ]);

        $this->requestJson('POST', '/api/grants', $payload);
        $this->assertResponseStatusCodeSame(201);
        $draftId = $this->responseData()['id'];

        $this->requestJson('POST', '/api/grants/'.$draftId.'/validate-budget');
        $this->assertResponseStatusCodeSame(422);
        self::assertStringContainsString('équilibré', $this->responseData()['message']);

        $payload['montantDemande'] = '0.00';
        $payload['lignesBudget'][0]['montant'] = '0.00';
        $payload['lignesBudget'][1]['montant'] = '0.00';
        $this->requestJson('PUT', '/api/grants/'.$draftId.'/draft', $payload);
        $this->assertResponseIsSuccessful();

        $this->requestJson('POST', '/api/grants/'.$draftId.'/validate-budget');
        $this->assertResponseStatusCodeSame(422);
        self::assertStringContainsString('montant positif', $this->responseData()['message']);

        $payload['montantDemande'] = 'non numérique';
        $this->requestJson('PUT', '/api/grants/'.$draftId.'/draft', $payload);
        $this->assertResponseStatusCodeSame(422);
        self::assertStringContainsString('montant positif', $this->responseData()['message']);
    }

    public function testAnotherAssociationCannotEditDraft(): void
    {
        $owner = $this->createAssociation('Association propriétaire');
        $this->authenticateAsMember($owner);
        $this->requestJson('POST', '/api/grants', $this->projectPayload([]));
        $this->assertResponseStatusCodeSame(201);
        $draftId = $this->responseData()['id'];

        $other = $this->createAssociation('Autre association');
        $this->authenticateAsMember($other);
        $this->requestJson('PUT', '/api/grants/'.$draftId.'/draft', $this->projectPayload([]));
        $this->assertResponseStatusCodeSame(403);
    }

    public function testDisabledGrantModuleIsForbidden(): void
    {
        $association = $this->createAssociation('Association sans module', false);
        $this->authenticateAsMember($association);

        $this->requestJson('GET', '/api/grants/drafts');
        $this->assertResponseStatusCodeSame(403);
    }

    public function testDocumentsCanBeUploadedWithoutBudgetValidation(): void
    {
        $association = $this->createAssociation('Association justificatifs');
        $this->authenticateAsMember($association);
        $payload = $this->projectPayload([
            $this->line('depense', 'achats', 'Matériel', '50.00'),
            $this->line('recette', 'subvention_mairie', 'Subvention mairie', '50.00'),
        ]);
        $this->requestJson('POST', '/api/grants', $payload);
        $this->assertResponseStatusCodeSame(201);
        $draftId = $this->responseData()['id'];

        $this->requestJson('GET', '/api/grants/'.$draftId.'/documents');
        $this->assertResponseIsSuccessful();

        $this->client->request(
            'POST',
            '/api/grants/'.$draftId.'/documents',
            ['typeDocument' => 'Formulaire de demande'],
            ['file' => $this->fixtures->pdf('formulaire.pdf')],
            ['HTTP_ACCEPT' => 'application/json', 'HTTP_X_REQUESTED_WITH' => 'XMLHttpRequest'],
        );
        $this->assertResponseStatusCodeSame(201);
        $this->assertJsonContains(['originalName' => 'formulaire.pdf']);

        $document = $this->em->getRepository(DocumentJustificatif::class)->findOneBy([]);
        self::assertInstanceOf(DocumentJustificatif::class, $document);
        self::assertSame('subvention', $document->getLieAType());
        self::assertSame($draftId, $document->getLieAId());
    }

    /**
     * @param list<array{type: string, categorie: string, intitule: string, montant: string}> $lines
     *
     * @return array<string, mixed>
     */
    private function projectPayload(array $lines): array
    {
        return [
            'typeSubvention' => 'Projet',
            'intituleProjet' => 'Festival associatif',
            'description' => 'Organiser une activité à destination des habitants.',
            'publicCible' => 'Habitants de la commune',
            'dateDebutProjet' => '2027-03-01',
            'dateFinProjet' => '2027-03-31',
            'montantDemande' => '50.00',
            'bic' => 'CMCIFRPP',
            'iban' => 'FR1420041010050500013M02606',
            'lignesBudget' => $lines,
        ];
    }

    /**
     * @return array{type: string, categorie: string, intitule: string, montant: string}
     */
    private function line(string $type, string $category, string $title, string $amount): array
    {
        return ['type' => $type, 'categorie' => $category, 'intitule' => $title, 'montant' => $amount];
    }

    private function createAssociation(string $name, bool $grantModule = true): Association
    {
        $association = (new Association())
            ->setNom($name)
            ->setModuleSubventionActif($grantModule);
        $this->em->persist($association);
        $this->em->flush();

        return $association;
    }

    private function authenticateAsMember(Association $association): void
    {
        $user = (new User())
            ->setEmail('membre.'.$association->getId().'@example.test')
            ->setNom('Membre')
            ->setPrenom('Association')
            ->setTypeCompte('association')
            ->setRoles(['ROLE_ASSOCIATION'])
            ->setIsVerified(true)
            ->setAssociation($association);
        $this->em->persist($user);
        $this->em->flush();
        $this->client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer '.$this->jwtManager->create($user));
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
