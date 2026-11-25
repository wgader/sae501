<?php

declare(strict_types=1);

namespace App\Tests\Controller;

use App\Entity\Association;
use App\Entity\Campaign;
use App\Entity\CampaignWish;
use App\Entity\CampaignWishSubmission;
use App\Entity\Salle;

/**
 * Arbitrage des vœux : dix associations sur le même créneau forment un seul groupe disputé.
 */
final class CampaignWishAdministrationControllerTest extends ControllerRouteTestCase
{
    public function testTenAssociationsOnTheSameSlotFormOneDisputedGroup(): void
    {
        [$campaign, $gym] = $this->setUpCampaign();
        for ($i = 1; $i <= 10; ++$i) {
            $this->wish($campaign, $gym, 'Club '.$i, 2, '18:00', $i % 2 ? '20:00' : '19:30');
        }
        $this->wish($campaign, $gym, 'Club seul', 3, '10:00', '11:00');
        $this->signInAgent(['ROLE_GESTION_SALLE']);

        $this->requestJson('GET', '/api/admin/campaign-wishes/campaigns/'.$campaign->getId());

        $this->assertResponseIsSuccessful();
        $data = $this->responseData();
        self::assertCount(2, $data['groups']);
        self::assertTrue($data['groups'][0]['disputed']);
        self::assertCount(10, $data['groups'][0]['wishes']);
        self::assertSame(['18:00', '20:00'], [$data['groups'][0]['startTime'], $data['groups'][0]['endTime']]);
        self::assertFalse($data['groups'][1]['disputed']);
        self::assertSame(['total' => 11, 'pending' => 11, 'accepted' => 0, 'refused' => 0, 'disputed' => 1], $data['counts']);
    }

    public function testAttributingASlotCanRefuseTheCompetitorsInOneGo(): void
    {
        [$campaign, $gym] = $this->setUpCampaign();
        $winner = $this->wish($campaign, $gym, 'Basket', 2, '18:00', '20:00');
        $other = $this->wish($campaign, $gym, 'Judo', 2, '19:00', '21:00');
        $elsewhere = $this->wish($campaign, $gym, 'Yoga', 2, '21:00', '22:00');
        $this->signInAgent(['ROLE_GESTION_SALLE']);

        $this->requestJson('POST', '/api/admin/campaign-wishes/'.$winner->getId().'/accept', ['refuseOthers' => true]);

        $this->assertResponseIsSuccessful();
        $this->em->clear();
        self::assertSame(CampaignWish::STATUS_ACCEPTED, $this->em->find(CampaignWish::class, $winner->getId())?->getStatus());
        $refused = $this->em->find(CampaignWish::class, $other->getId());
        self::assertSame(CampaignWish::STATUS_REFUSED, $refused?->getStatus());
        self::assertNotEmpty($refused?->getDecisionComment());
        // 21:00 ne chevauche pas 18:00-20:00 : ce vœu reste à arbitrer.
        self::assertSame(CampaignWish::STATUS_PENDING, $this->em->find(CampaignWish::class, $elsewhere->getId())?->getStatus());
    }

    public function testASlotCannotBeGivenTwiceAndARefusalNeedsAReason(): void
    {
        [$campaign, $gym] = $this->setUpCampaign();
        $first = $this->wish($campaign, $gym, 'Basket', 2, '18:00', '20:00');
        $second = $this->wish($campaign, $gym, 'Judo', 2, '19:00', '21:00');
        $this->signInAgent(['ROLE_GESTION_SALLE']);

        $this->requestJson('POST', '/api/admin/campaign-wishes/'.$first->getId().'/accept');
        $this->assertResponseIsSuccessful();
        $this->requestJson('POST', '/api/admin/campaign-wishes/'.$second->getId().'/accept');
        $this->assertResponseStatusCodeSame(409);

        $this->requestJson('POST', '/api/admin/campaign-wishes/'.$second->getId().'/refuse', ['comment' => '']);
        $this->assertResponseStatusCodeSame(422);
        $this->requestJson('POST', '/api/admin/campaign-wishes/'.$second->getId().'/refuse', ['comment' => 'Salle déjà occupée']);
        $this->assertResponseIsSuccessful();

        $this->requestJson('POST', '/api/admin/campaign-wishes/'.$first->getId().'/reset');
        $this->assertResponseIsSuccessful();
        $this->em->clear();
        self::assertSame(CampaignWish::STATUS_PENDING, $this->em->find(CampaignWish::class, $first->getId())?->getStatus());
    }

    public function testOnlyRoomAgentsCanArbitrate(): void
    {
        [$campaign] = $this->setUpCampaign();
        $this->signInAgent(['ROLE_GESTION_MATERIEL']);
        $this->requestJson('GET', '/api/admin/campaign-wishes/campaigns/'.$campaign->getId());
        $this->assertResponseStatusCodeSame(403);
    }

    /**
     * @return array{Campaign, Salle}
     */
    private function setUpCampaign(): array
    {
        $campaign = (new Campaign())
            ->setSeasonLabel('Saison 2027-2028')
            ->setOpeningAt(new \DateTimeImmutable('-1 day'))
            ->setClosingAt(new \DateTimeImmutable('+5 days'))
            ->setResourceTypes(['salle'])
            ->setStatus(Campaign::STATUS_ACTIVE);
        $gym = (new Salle())
            ->setNom('Gymnase')
            ->setAdresse('Place de la Mairie, Feytiat')
            ->setCapaciteMax(80)
            ->setAccesPmr(true)
            ->setEquipementsInclus([])
            ->setIsActive(true)
            ->setCreatedAt(new \DateTimeImmutable())
            ->setUpdatedAt(new \DateTimeImmutable());
        $this->em->persist($campaign);
        $this->em->persist($gym);
        $this->em->flush();

        return [$campaign, $gym];
    }

    private function wish(Campaign $campaign, Salle $salle, string $club, int $day, string $start, string $end): CampaignWish
    {
        $association = (new Association())->setNom($club)->setStatut('VALIDATED')->setModuleSalleActif(true);
        $this->em->persist($association);
        $wish = new CampaignWish($salle, $day, new \DateTimeImmutable('2027-09-01'), $start, $end, 'weekly', 'Entraînement', 'youth', 20);
        $submission = (new CampaignWishSubmission($campaign, $association, null))->addWish($wish);
        $this->em->persist($submission);
        $this->em->flush();

        return $wish;
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
