<?php

declare(strict_types=1);

namespace App\Tests\Controller;

use App\Entity\Association;
use App\Entity\Campaign;
use App\Entity\DocumentJustificatif;
use App\Entity\ReservationSalle;
use App\Entity\Salle;
use App\Entity\User;
use App\Tests\Fixtures\FailingDocumentFlushListener;
use App\Tests\Fixtures\UploadFixtures;
use Symfony\Component\Filesystem\Filesystem;

/**
 * Pièce justificative jointe à une demande de réservation de salle (POST /api/rooms/reservations).
 */
final class RoomReservationJustificatifTest extends ControllerRouteTestCase
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

    public function testJustificatifIsStoredWithTheReservation(): void
    {
        $salle = $this->prepareReservationContext();

        $this->reserve($salle);

        $this->assertResponseStatusCodeSame(201);
        $document = $this->em->getRepository(DocumentJustificatif::class)->findOneBy(['lieAType' => 'salle']);
        self::assertInstanceOf(DocumentJustificatif::class, $document);
        self::assertFileExists($this->storageDirectory.'/'.$document->getFichierUrl());
    }

    public function testFailedReservationLeavesNoOrphanFile(): void
    {
        $salle = $this->prepareReservationContext();
        FailingDocumentFlushListener::attachTo($this->em);

        $this->reserve($salle);

        $this->assertResponseStatusCodeSame(500);
        self::assertSame(0, $this->em->getRepository(ReservationSalle::class)->count([]));
        self::assertSame([], is_dir($this->storageDirectory) ? (glob($this->storageDirectory.'/*/*/*') ?: []) : []);
    }

    private function prepareReservationContext(): Salle
    {
        $association = (new Association())
            ->setNom('Amicale du parc')
            ->setStatut('VALIDATED')
            ->setModuleSalleActif(true);
        $user = (new User())
            ->setEmail('amicale.parc@example.test')
            ->setNom('Dupont')
            ->setPrenom('Alice')
            ->setTypeCompte('association')
            ->setRoles(['ROLE_ASSOCIATION'])
            ->setIsVerified(true)
            ->setAssociation($association);
        $salle = (new Salle())
            ->setNom('Grande salle')
            ->setAdresse('12 rue de la République, 87220 Feytiat')
            ->setCapaciteMax(150)
            ->setAccesPmr(true)
            ->setIsActive(true)
            ->setCreatedAt(new \DateTimeImmutable())
            ->setUpdatedAt(new \DateTimeImmutable());
        $this->em->persist($association);
        $this->em->persist($user);
        $campaign = (new Campaign())
            ->setSeasonLabel('Saison test')
            ->setOpeningAt(new \DateTimeImmutable('-1 day'))
            ->setClosingAt(new \DateTimeImmutable('+30 days'))
            ->setResourceTypes(['salle'])
            ->setStatus(Campaign::STATUS_ACTIVE);
        $this->em->persist($salle);
        $this->em->persist($campaign);
        $this->em->flush();
        $this->client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer '.$this->jwtManager->create($user));

        return $salle;
    }

    private function reserve(Salle $salle): void
    {
        $this->client->request('POST', '/api/rooms/reservations', [
            'salleId' => (string) $salle->getId(),
            'motifEvenement' => 'Assemblée générale',
            'dateDebut' => '2026-12-22T10:00:00+01:00',
            'dateFin' => '2026-12-22T13:00:00+01:00',
            'capaciteAttendue' => '90',
        ], ['justificatif' => $this->fixtures->pdf('assurance.pdf')], ['HTTP_ACCEPT' => 'application/json']);
    }
}
