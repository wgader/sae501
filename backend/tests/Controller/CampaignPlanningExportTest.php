<?php

declare(strict_types=1);

namespace App\Tests\Controller;

use App\Entity\Association;
use App\Entity\Campaign;
use App\Entity\ReservationSalle;
use App\Entity\Salle;
use App\Entity\User;
use App\Service\CampaignPlanningExporter;

/**
 * Export PDF du planning des demandes de salle d'une campagne (réunion d'arbitrage).
 */
final class CampaignPlanningExportTest extends ControllerRouteTestCase
{
    private Campaign $campaign;
    private Association $amicale;
    private Association $chorale;
    private Salle $grandeSalle;
    private Salle $petiteSalle;

    protected function setUp(): void
    {
        parent::setUp();

        $this->campaign = (new Campaign())
            ->setSeasonLabel('Saison 2027-2028')
            ->setOpeningAt(new \DateTimeImmutable('-1 day'))
            ->setClosingAt(new \DateTimeImmutable('+30 days'))
            ->setResourceTypes(['salle'])
            ->setStatus(Campaign::STATUS_ACTIVE);
        $this->amicale = (new Association())->setNom('Amicale du parc')->setStatut('VALIDATED');
        $this->chorale = (new Association())->setNom('Chorale du bourg')->setStatut('VALIDATED');
        $this->grandeSalle = $this->salle('Grande salle');
        $this->petiteSalle = $this->salle('Petite salle');
        foreach ([$this->campaign, $this->amicale, $this->chorale, $this->grandeSalle, $this->petiteSalle] as $entity) {
            $this->em->persist($entity);
        }
        $this->em->flush();
    }

    public function testExportRequiresAuthentication(): void
    {
        $this->assertRequiresAuthentication('GET', $this->url());
    }

    public function testAssociationCannotExportThePlanning(): void
    {
        $member = (new User())
            ->setEmail('amicale@example.test')
            ->setNom('Dupont')
            ->setPrenom('Alice')
            ->setTypeCompte('association')
            ->setRoles(['ROLE_ASSOCIATION'])
            ->setIsVerified(true)
            ->setAssociation($this->amicale);
        $this->em->persist($member);
        $this->em->flush();
        $this->client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer '.$this->jwtManager->create($member));

        $this->client->request('GET', $this->url());

        $this->assertResponseStatusCodeSame(403);
    }

    public function testAdminDownloadsAPdf(): void
    {
        $this->request($this->amicale, $this->grandeSalle, '2027-06-10 18:00', '2027-06-10 20:00');
        $this->authenticateAsAdmin();

        $this->client->request('GET', $this->url('?view=salle'));

        $this->assertResponseIsSuccessful();
        $this->assertResponseHeaderSame('Content-Type', 'application/pdf');
        $this->assertResponseHeaderSame('Content-Disposition', 'attachment; filename=planning-salles-saison-2027-2028-salle.pdf');
        self::assertStringStartsWith('%PDF-', (string) $this->client->getResponse()->getContent());
    }

    public function testInvalidParametersAreRejected(): void
    {
        $this->authenticateAsAdmin();

        foreach (['?from=10/06/2027', '?from=2027-06-12&to=2027-06-10', '?view=calendrier'] as $query) {
            $this->client->request('GET', $this->url($query));
            $this->assertResponseStatusCodeSame(422, $query);
        }
    }

    public function testPlanningListsRequestsAndFlagsOverlaps(): void
    {
        $this->request($this->amicale, $this->grandeSalle, '2027-06-10 18:00', '2027-06-10 20:00', 'Répétition générale');
        $this->request($this->chorale, $this->grandeSalle, '2027-06-10 19:00', '2027-06-10 21:00', 'Concert de printemps');
        $this->request($this->chorale, $this->petiteSalle, '2027-06-11 10:00', '2027-06-11 12:00', 'Réunion du bureau');

        $html = $this->exporter()->html($this->campaign, null, null);

        self::assertStringContainsString('Planning général', $html);
        self::assertStringContainsString('Demandes par salle', $html);
        self::assertStringContainsString('Demandes par association', $html);
        self::assertStringContainsString('Jeudi 10 juin 2027', $html);
        self::assertStringContainsString('18:00 – 20:00', $html);
        self::assertStringContainsString('Chevauche : Chorale du bourg', $html);
        self::assertStringContainsString('Chevauche : Amicale du parc', $html);
        self::assertStringContainsString('Toute la campagne (créneaux du 10 juin 2027 au 11 juin 2027)', $html);
    }

    public function testPeriodAndRefusedFilters(): void
    {
        $this->request($this->amicale, $this->grandeSalle, '2027-06-10 18:00', '2027-06-10 20:00', 'Répétition générale');
        $this->request($this->chorale, $this->petiteSalle, '2027-07-01 10:00', '2027-07-01 12:00', 'Réunion de juillet');
        $this->request($this->chorale, $this->petiteSalle, '2027-06-12 10:00', '2027-06-12 12:00', 'Demande refusée')
            ->setStatut('Refusée');
        $this->em->flush();

        $june = $this->exporter()->html($this->campaign, new \DateTimeImmutable('2027-06-01'), new \DateTimeImmutable('2027-06-30'), CampaignPlanningExporter::VIEW_GENERAL);

        self::assertStringContainsString('Répétition générale', $june);
        self::assertStringNotContainsString('Réunion de juillet', $june);
        self::assertStringNotContainsString('Demande refusée', $june);
        self::assertStringNotContainsString('Demandes par salle', $june);
        self::assertStringContainsString('Du 1 juin 2027 au 30 juin 2027', $june);

        $withRefused = $this->exporter()->html($this->campaign, null, null, CampaignPlanningExporter::VIEW_GENERAL, true);
        self::assertStringContainsString('Demande refusée', $withRefused);
    }

    private function exporter(): CampaignPlanningExporter
    {
        $exporter = static::getContainer()->get(CampaignPlanningExporter::class);
        self::assertInstanceOf(CampaignPlanningExporter::class, $exporter);

        return $exporter;
    }

    private function url(string $query = ''): string
    {
        return '/api/admin/campaigns/'.$this->campaign->getId().'/planning.pdf'.$query;
    }

    private function request(Association $association, Salle $salle, string $start, string $end, string $motif = 'Répétition'): ReservationSalle
    {
        $reservation = (new ReservationSalle())
            ->setAssociation($association)
            ->setSalle($salle)
            ->setCampaign($this->campaign)
            ->setMotifEvenement($motif)
            ->setDateDebut(new \DateTimeImmutable($start))
            ->setDateFin(new \DateTimeImmutable($end))
            ->setStatut('En attente de validation par la mairie')
            ->setCreatedAt(new \DateTimeImmutable());
        $this->em->persist($reservation);
        $this->em->flush();

        return $reservation;
    }

    private function salle(string $nom): Salle
    {
        return (new Salle())
            ->setNom($nom)
            ->setAdresse('12 rue de la République, 87220 Feytiat')
            ->setCapaciteMax(100)
            ->setAccesPmr(true)
            ->setIsActive(true)
            ->setCreatedAt(new \DateTimeImmutable())
            ->setUpdatedAt(new \DateTimeImmutable());
    }
}
