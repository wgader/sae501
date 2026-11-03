<?php

namespace App\Tests\Controller;

use App\Entity\Association;
use App\Entity\DemandeStatusHistory;
use App\Entity\DemandeSubvention;
use App\Entity\Materiel;
use App\Entity\ReservationMateriel;
use App\Entity\ReservationMaterielLigne;
use App\Entity\ReservationSalle;
use App\Entity\Salle;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class AssociationRequestControllerTest extends WebTestCase
{
    private KernelBrowser $client;
    private EntityManagerInterface $em;
    private JWTTokenManagerInterface $jwtManager;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $this->em = static::getContainer()->get(EntityManagerInterface::class);
        $this->jwtManager = static::getContainer()->get(JWTTokenManagerInterface::class);

        // Reset SQLite schema for each test run
        $schemaTool = new SchemaTool($this->em);
        $metadata = $this->em->getMetadataFactory()->getAllMetadata();
        $schemaTool->dropSchema($metadata);
        $schemaTool->createSchema($metadata);
    }

    private function requestWithAuth(User $user, string $method, string $uri): void
    {
        $token = $this->jwtManager->create($user);
        $this->client->request($method, $uri, [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
            'CONTENT_TYPE' => 'application/json',
            'HTTP_ACCEPT' => 'application/json',
        ]);
    }

    public function testListRequiresAuthentication(): void
    {
        $this->client->request('GET', '/api/association/requests');
        $this->assertResponseStatusCodeSame(401);
    }

    public function testShowRequiresAuthentication(): void
    {
        $this->client->request('GET', '/api/association/requests/mat-1');
        $this->assertResponseStatusCodeSame(401);
    }

    public function testListForbiddenWhenUserHasNoAssociation(): void
    {
        $userMairie = new User();
        $userMairie->setEmail('agent@feytiat.fr');
        $userMairie->setNom('Dupont');
        $userMairie->setPrenom('Jean');
        $userMairie->setTypeCompte('mairie');
        $userMairie->setIsVerified(true);
        $this->em->persist($userMairie);
        $this->em->flush();

        $this->requestWithAuth($userMairie, 'GET', '/api/association/requests');
        $this->assertResponseStatusCodeSame(403);
    }

    public function testListReturnsConsolidatedRequestsAndCounts(): void
    {
        [$userAsso, $asso1] = $this->createAssociationAndUser('Club de Tennis');

        // Subvention
        $sub = new DemandeSubvention();
        $sub->setAssociation($asso1);
        $sub->setIntituleProjet('Achat matériel d’entraînement');
        $sub->setMontantDemande('2500.00');
        $sub->setAnneeExercice(2026);
        $sub->setStatut('En cours de traitement');
        $this->em->persist($sub);

        // Materiel
        $equip = new Materiel();
        $equip->setDesignation('Table pliante');
        $equip->setCategorie('mobilier');
        $equip->setStockTotal(10);
        $this->em->persist($equip);

        $mat = new ReservationMateriel();
        $mat->setAssociation($asso1);
        $mat->setMotifEvenement('Tournoi annuel');
        $mat->setDateRetrait(new \DateTimeImmutable('2026-06-10 09:00:00'));
        $mat->setDateRestitution(new \DateTimeImmutable('2026-06-12 18:00:00'));
        $mat->setStatut('Validée');

        $ligne = new ReservationMaterielLigne();
        $ligne->setMateriel($equip);
        $ligne->setQuantite(4);
        $mat->addLigne($ligne);
        $this->em->persist($mat);

        // Salle
        $salle = new Salle();
        $salle->setNom('Gymnase municipal');
        $salle->setAdresse('Rue des Sports, 87220 Feytiat');
        $salle->setCapaciteMax(150);
        $salle->setAccesPmr(true);
        $salle->setCreatedAt(new \DateTimeImmutable());
        $salle->setUpdatedAt(new \DateTimeImmutable());
        $salle->setIsActive(true);
        $this->em->persist($salle);

        $sal = new ReservationSalle();
        $sal->setAssociation($asso1);
        $sal->setSalle($salle);
        $sal->setMotifEvenement('Remise des prix');
        $sal->setDateDebut(new \DateTimeImmutable('2026-06-12 18:00:00'));
        $sal->setDateFin(new \DateTimeImmutable('2026-06-12 23:00:00'));
        $sal->setStatut('Clôturée');
        $this->em->persist($sal);

        $this->em->flush();

        $this->requestWithAuth($userAsso, 'GET', '/api/association/requests');
        $this->assertResponseIsSuccessful();
        $data = json_decode((string) $this->client->getResponse()->getContent(), true);

        $this->assertSame(3, $data['totalItems']);
        $this->assertSame(3, $data['counts']['all']);
        $this->assertSame(2, $data['counts']['active']); // Subvention ('En cours de traitement') + Materiel ('Validée')
        $this->assertSame(1, $data['counts']['closed']); // Salle ('Clôturée')
        $this->assertSame(1, $data['counts']['subvention']);
        $this->assertSame(1, $data['counts']['materiel']);
        $this->assertSame(1, $data['counts']['salle']);
    }

    public function testListFilters(): void
    {
        [$userAsso, $asso1] = $this->createAssociationAndUser('Feytiat Basket');

        $sub = new DemandeSubvention();
        $sub->setAssociation($asso1);
        $sub->setIntituleProjet('Subvention Jeunesse');
        $sub->setMontantDemande('1000.00');
        $sub->setAnneeExercice(2026);
        $sub->setStatut('En cours de traitement');
        $this->em->persist($sub);

        $salle = new Salle();
        $salle->setNom('Salle des fêtes');
        $salle->setAdresse('1 Place de la Mairie, 87220 Feytiat');
        $salle->setCapaciteMax(80);
        $salle->setAccesPmr(true);
        $salle->setCreatedAt(new \DateTimeImmutable());
        $salle->setUpdatedAt(new \DateTimeImmutable());
        $salle->setIsActive(true);
        $this->em->persist($salle);

        $sal = new ReservationSalle();
        $sal->setAssociation($asso1);
        $sal->setSalle($salle);
        $sal->setMotifEvenement('Assemblée générale');
        $sal->setDateDebut(new \DateTimeImmutable('2025-05-01 10:00:00'));
        $sal->setDateFin(new \DateTimeImmutable('2025-05-01 12:00:00'));
        $sal->setStatut('Refusée');
        $this->em->persist($sal);

        $this->em->flush();

        // Filter active
        $this->requestWithAuth($userAsso, 'GET', '/api/association/requests?status=active');
        $this->assertResponseIsSuccessful();
        $data = json_decode((string) $this->client->getResponse()->getContent(), true);
        $this->assertCount(1, $data['items']);
        $this->assertSame('Subvention Jeunesse', $data['items'][0]['intitule']);

        // Filter closed
        $this->requestWithAuth($userAsso, 'GET', '/api/association/requests?status=closed');
        $this->assertResponseIsSuccessful();
        $data = json_decode((string) $this->client->getResponse()->getContent(), true);
        $this->assertCount(1, $data['items']);
        $this->assertSame('Assemblée générale', $data['items'][0]['intitule']);

        // Filter type
        $this->requestWithAuth($userAsso, 'GET', '/api/association/requests?type=subvention');
        $this->assertResponseIsSuccessful();
        $data = json_decode((string) $this->client->getResponse()->getContent(), true);
        $this->assertCount(1, $data['items']);
        $this->assertSame('subvention', $data['items'][0]['type']);

        // Filter search
        $this->requestWithAuth($userAsso, 'GET', '/api/association/requests?search=' . urlencode('assemblée'));
        $this->assertResponseIsSuccessful();
        $data = json_decode((string) $this->client->getResponse()->getContent(), true);
        $this->assertCount(1, $data['items']);
        $this->assertSame('Assemblée générale', $data['items'][0]['intitule']);
    }

    public function testShowDetailAndTimeline(): void
    {
        [$userAsso, $asso1] = $this->createAssociationAndUser('Feytiat Musique');

        $sub = new DemandeSubvention();
        $sub->setAssociation($asso1);
        $sub->setIntituleProjet('Festival de Cuivres 2026');
        $sub->setMontantDemande('3000.00');
        $sub->setMontantAccorde('2500.00');
        $sub->setAnneeExercice(2026);
        $sub->setStatut('Validée');
        $sub->setObservations('Subvention approuvée par la commission municipale.');
        $this->em->persist($sub);
        $this->em->flush();

        // History entry
        $history = new DemandeStatusHistory(
            demandeType: 'subvention',
            demandeId: (int) $sub->getId(),
            statut: 'Validée',
            label: 'Dossier validé',
            commentaire: 'Accord de subvention voté en conseil municipal.',
            auteur: 'Mairie de Feytiat',
            createdAt: new \DateTimeImmutable('2026-05-10 14:00:00'),
        );
        $this->em->persist($history);
        $this->em->flush();

        $this->requestWithAuth($userAsso, 'GET', '/api/association/requests/sub-' . $sub->getId());
        $this->assertResponseIsSuccessful();
        $data = json_decode((string) $this->client->getResponse()->getContent(), true);

        $this->assertSame('Festival de Cuivres 2026', $data['intitule']);
        $this->assertEquals(3000.0, $data['montantDemande']);
        $this->assertEquals(2500.0, $data['montantAccorde']);
        $this->assertSame('Validée', $data['statut']);
        $this->assertNotEmpty($data['timeline']);
        $this->assertSame('Dossier validé', $data['timeline'][0]['label']);
    }

    public function testShowForbiddenWhenBelongsToAnotherAssociation(): void
    {
        [$userAsso1, $asso1] = $this->createAssociationAndUser('Asso 1');
        [, $asso2] = $this->createAssociationAndUser('Asso 2', 'asso2@feytiat.fr');

        $sub = new DemandeSubvention();
        $sub->setAssociation($asso2); // belongs to asso 2
        $sub->setIntituleProjet('Projet Asso 2');
        $sub->setMontantDemande('1200.00');
        $sub->setAnneeExercice(2026);
        $this->em->persist($sub);
        $this->em->flush();

        // Asso 1 tries to view Asso 2's request
        $this->requestWithAuth($userAsso1, 'GET', '/api/association/requests/sub-' . $sub->getId());
        $this->assertResponseStatusCodeSame(403);
    }

    public function testShowNotFoundWhenDoesNotExist(): void
    {
        [$userAsso1] = $this->createAssociationAndUser('Asso Test');
        $this->requestWithAuth($userAsso1, 'GET', '/api/association/requests/sub-99999');
        $this->assertResponseStatusCodeSame(404);
    }

    /**
     * @return array{0: User, 1: Association}
     */
    private function createAssociationAndUser(string $nomAsso, string $email = 'asso@feytiat.fr'): array
    {
        $asso = new Association();
        $asso->setNom($nomAsso);
        $this->em->persist($asso);

        $user = new User();
        $user->setEmail($email);
        $user->setNom('Président');
        $user->setPrenom('Pierre');
        $user->setTypeCompte('association');
        $user->setIsVerified(true);
        $user->setAssociation($asso);
        $this->em->persist($user);

        $this->em->flush();

        return [$user, $asso];
    }
}
