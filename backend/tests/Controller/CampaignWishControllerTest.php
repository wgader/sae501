<?php

declare(strict_types=1);

namespace App\Tests\Controller;

use App\Entity\Campaign;
use App\Entity\CampaignWish;
use App\Entity\Salle;
use App\Message\SendCampaignWishConfirmationMessage;
use App\MessageHandler\SendCampaignWishConfirmationMessageHandler;
use Symfony\Component\Messenger\Transport\InMemory\InMemoryTransport;

/**
 * Dépôt des vœux récurrents par une association (ticket « Dépôt Vœux »).
 */
final class CampaignWishControllerTest extends ControllerRouteTestCase
{
    private const URI = '/api/campaigns/current/wishes';

    public function testWishesAreSubmittedAsRecurrentAndAwaitArbitration(): void
    {
        $this->createCampaign('-1 day', '+5 days');
        $gym = $this->createSalle('Gymnase', 80);
        $this->signInAssociationMember(['salles']);

        $this->requestJson('POST', self::URI, ['wishes' => [
            $this->line($gym, 2, '18:00', '20:00'),
            $this->line($gym, 4, '19:00', '21:00', 'biweekly'),
        ]]);

        $this->assertResponseStatusCodeSame(201);
        $submission = $this->responseData();
        self::assertCount(2, $submission['wishes']);
        foreach ($submission['wishes'] as $wish) {
            self::assertSame(CampaignWish::TYPE_RECURRENT, $wish['type']);
            self::assertSame('En attente d’arbitrage par la mairie', $wish['status']);
        }

        // L'accusé de réception part par la file asynchrone, avec un seul message pour le dossier.
        /** @var InMemoryTransport $transport */
        $transport = static::getContainer()->get('messenger.transport.async');
        $messages = array_map(static fn ($envelope) => $envelope->getMessage(), $transport->getSent());
        $confirmations = array_values(array_filter($messages, static fn (object $m): bool => $m instanceof SendCampaignWishConfirmationMessage));
        self::assertCount(1, $confirmations);

        // Le worker relit le dossier en base, avec les comptes de l'association.
        $this->em->clear();
        static::getContainer()->get(SendCampaignWishConfirmationMessageHandler::class)($confirmations[0]);
        $this->assertEmailCount(1);
        $this->assertEmailHtmlBodyContains($this->getMailerMessage(0), 'Gymnase');

        $this->requestJson('GET', self::URI);
        self::assertCount(1, $this->responseData()['submissions']);
    }

    public function testSubmissionIsRefusedWhenNoCampaignIsOpen(): void
    {
        $this->createCampaign('+2 days', '+5 days', open: false);
        $gym = $this->createSalle('Gymnase');
        $this->signInAssociationMember(['salles']);

        $this->requestJson('POST', self::URI, ['wishes' => [$this->line($gym, 1, '10:00', '11:00')]]);

        $this->assertResponseStatusCodeSame(403);
        $this->assertJsonContains(['code' => 'CAMPAIGN_CLOSED']);
    }

    public function testSubmissionIsRefusedOnceTheDeadlineHasPassed(): void
    {
        // Campagne encore marquée active alors que sa date de clôture est passée.
        $campaign = $this->createCampaign('-5 days', '-1 minute');
        self::assertSame(Campaign::STATUS_ACTIVE, $campaign->getStatus());
        $gym = $this->createSalle('Gymnase');
        $this->signInAssociationMember(['salles']);

        $this->requestJson('POST', self::URI, ['wishes' => [$this->line($gym, 1, '10:00', '11:00')]]);

        $this->assertResponseStatusCodeSame(403);
        $this->assertJsonContains(['code' => 'CAMPAIGN_CLOSED']);
    }

    public function testInvalidLinesAreReportedWithTheirLineAndField(): void
    {
        $this->createCampaign('-1 day', '+5 days');
        $gym = $this->createSalle('Gymnase', 30);
        $this->signInAssociationMember(['salles']);

        $this->requestJson('POST', self::URI, ['wishes' => [
            $this->line($gym, 2, '20:00', '18:00'),
            $this->line($gym, 9, '25:00', '26:00'),
            $this->line($gym, 3, '10:00', '12:00', attendance: 50),
        ]]);

        $this->assertResponseStatusCodeSame(422);
        $fields = array_map(static fn (array $error): string => $error['line'].':'.$error['field'], $this->responseData()['errors']);
        self::assertContains('1:endTime', $fields);
        self::assertContains('2:dayOfWeek', $fields);
        self::assertContains('2:startTime', $fields);
        self::assertContains('3:expectedAttendance', $fields);
    }

    public function testTwoWishesOfTheSameFileCannotOverlap(): void
    {
        $this->createCampaign('-1 day', '+5 days');
        $gym = $this->createSalle('Gymnase');
        $this->signInAssociationMember(['salles']);

        $this->requestJson('POST', self::URI, ['wishes' => [
            $this->line($gym, 2, '18:00', '20:00'),
            $this->line($gym, 2, '19:00', '21:00'),
        ]]);

        $this->assertResponseStatusCodeSame(422);
        $this->assertJsonContains(['errors' => [['line' => 2, 'field' => 'startTime']]]);
    }

    public function testOnlyAssociationsWithTheRoomsModuleCanSubmit(): void
    {
        $this->createCampaign('-1 day', '+5 days');
        $this->signInAssociationMember(['materiel']);
        $this->requestJson('GET', self::URI);
        $this->assertResponseStatusCodeSame(403);
    }

    private function createCampaign(string $opening, string $closing, bool $open = true): Campaign
    {
        $campaign = (new Campaign())
            ->setSeasonLabel('Saison 2027-2028')
            ->setOpeningAt(new \DateTimeImmutable($opening))
            ->setClosingAt(new \DateTimeImmutable($closing))
            ->setResourceTypes(['salle']);
        if ($open) {
            $campaign->setStatus(Campaign::STATUS_ACTIVE);
        }
        $this->em->persist($campaign);
        $this->em->flush();

        return $campaign;
    }

    private function createSalle(string $nom, int $capacity = 100): Salle
    {
        $salle = (new Salle())
            ->setNom($nom)
            ->setAdresse('Place de la Mairie, Feytiat')
            ->setCapaciteMax($capacity)
            ->setAccesPmr(true)
            ->setEquipementsInclus([])
            ->setIsActive(true)
            ->setCreatedAt(new \DateTimeImmutable())
            ->setUpdatedAt(new \DateTimeImmutable());
        $this->em->persist($salle);
        $this->em->flush();

        return $salle;
    }

    /**
     * @return array<string, mixed>
     */
    private function line(Salle $salle, int $day, string $start, string $end, string $frequency = 'weekly', int $attendance = 20): array
    {
        $startDate = new \DateTimeImmutable('2027-09-01');
        while ((int) $startDate->format('N') !== $day) {
            $startDate = $startDate->modify('+1 day');
        }

        return [
            'salleId' => $salle->getId(),
            'startDate' => $startDate->format('Y-m-d'),
            'dayOfWeek' => $day,
            'startTime' => $start,
            'endTime' => $end,
            'frequency' => $frequency,
            'activity' => 'Entraînement de basket',
            'audience' => 'youth',
            'expectedAttendance' => $attendance,
        ];
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
