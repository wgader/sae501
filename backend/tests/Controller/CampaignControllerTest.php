<?php

declare(strict_types=1);

namespace App\Tests\Controller;

use App\Entity\Campaign;
use App\Entity\User;

final class CampaignControllerTest extends ControllerRouteTestCase
{
    public function testAdministrationRequiresAuthentication(): void
    {
        $this->assertRequiresAuthentication('GET', '/api/admin/campaigns');
    }

    public function testAssociationCannotAccessAdministration(): void
    {
        $user = (new User())
            ->setEmail('association@example.test')
            ->setNom('Association')
            ->setPrenom('User')
            ->setTypeCompte('association')
            ->setRoles(['ROLE_ASSOCIATION'])
            ->setIsVerified(true);
        $this->em->persist($user);
        $this->em->flush();
        $this->client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer '.$this->jwtManager->create($user));

        $this->client->request('GET', '/api/admin/campaigns');

        $this->assertResponseStatusCodeSame(403);
    }

    public function testCampaignCreationRejectsIncoherentDates(): void
    {
        $this->authenticateAsAdmin();
        $this->requestJson('POST', '/api/admin/campaigns', [
            'seasonLabel' => 'Saison 2026-2027',
            'openingAt' => '2026-06-01T09:00:00+02:00',
            'closingAt' => '2026-06-01T09:00:00+02:00',
            'resourceTypes' => ['salle'],
        ]);

        $this->assertResponseStatusCodeSame(422);
        $this->assertJsonContains([
            'violations' => [
                [
                    'propertyPath' => 'closingAt',
                    'message' => 'La clôture doit être postérieure à l’ouverture.',
                ],
            ],
        ]);
    }

    public function testRoomManagerCanCreateAndOpenCampaign(): void
    {
        $user = (new User())
            ->setEmail('room-manager@example.test')
            ->setNom('Gestionnaire')
            ->setPrenom('Salle')
            ->setTypeCompte('mairie')
            ->setRoles(['ROLE_GESTION_SALLE'])
            ->setIsVerified(true);
        $this->em->persist($user);
        $this->em->flush();
        $this->client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer '.$this->jwtManager->create($user));

        $this->requestJson('POST', '/api/admin/campaigns', [
            'seasonLabel' => 'Saison 2026-2027',
            'openingAt' => '2026-06-01T09:00:00+02:00',
            'closingAt' => '2026-06-30T18:00:00+02:00',
            'resourceTypes' => ['salle', 'local-partage'],
        ]);

        $this->assertResponseStatusCodeSame(201);
        $campaign = json_decode((string) $this->client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(Campaign::STATUS_PROGRAMMED, $campaign['status']);

        $this->client->request('POST', '/api/admin/campaigns/'.$campaign['id'].'/open');
        $this->assertResponseIsSuccessful();
        $this->assertJsonContains(['status' => Campaign::STATUS_ACTIVE]);
    }

    public function testCurrentEndpointExposesActiveCampaignToAssociation(): void
    {
        $this->authenticateAsAdmin();
        $campaign = (new Campaign())
            ->setSeasonLabel('Saison 2026-2027')
            ->setOpeningAt(new \DateTimeImmutable('+1 day'))
            ->setClosingAt(new \DateTimeImmutable('+2 days'))
            ->setResourceTypes(['salle']);
        $this->em->persist($campaign);
        $this->em->flush();
        static::getContainer()->get(\App\Service\CampaignService::class)->open($campaign);

        $association = (new User())
            ->setEmail('association-current@example.test')
            ->setNom('Association')
            ->setPrenom('Current')
            ->setTypeCompte('association')
            ->setRoles(['ROLE_ASSOCIATION'])
            ->setIsVerified(true);
        $this->em->persist($association);
        $this->em->flush();
        $this->client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer '.$this->jwtManager->create($association));

        $this->client->request('GET', '/api/campaigns/current');

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains([
            'active' => true,
            'campaign' => [
                'status' => Campaign::STATUS_ACTIVE,
                'statusLabel' => 'Active',
            ],
        ]);
    }

    public function testCurrentEndpointExposesUpcomingCampaignStatus(): void
    {
        $this->authenticateAsAdmin();
        $campaign = (new Campaign())
            ->setSeasonLabel('Saison à venir')
            ->setOpeningAt(new \DateTimeImmutable('+1 day'))
            ->setClosingAt(new \DateTimeImmutable('+2 days'))
            ->setResourceTypes(['salle']);
        $this->em->persist($campaign);
        $this->em->flush();

        $this->client->request('GET', '/api/campaigns/current');

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains([
            'active' => false,
            'campaign' => [
                'status' => Campaign::STATUS_PROGRAMMED,
                'statusLabel' => 'Programmée',
            ],
        ]);
    }

    public function testRoomSubmissionIsBlockedWithoutActiveCampaign(): void
    {
        $this->authenticateAsAdmin();
        $this->requestJson('POST', '/api/reservation_salles', []);

        $this->assertResponseStatusCodeSame(403);
        $this->assertJsonContains([
            'message' => 'Le dépôt des vœux annuels est fermé : aucune campagne active.',
        ]);
    }
}
