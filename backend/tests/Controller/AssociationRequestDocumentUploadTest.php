<?php

declare(strict_types=1);

namespace App\Tests\Controller;

use App\Entity\Association;
use App\Entity\DocumentJustificatif;
use App\Entity\ReservationMateriel;
use App\Entity\User;
use App\Tests\Fixtures\UploadFixtures;
use Symfony\Component\Filesystem\Filesystem;
use Symfony\Component\HttpFoundation\File\UploadedFile;

/**
 * Dépôt d’une pièce justificative par une association : POST /api/association/requests/{id}/documents.
 */
final class AssociationRequestDocumentUploadTest extends ControllerRouteTestCase
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

    public function testUploadRequiresAuthentication(): void
    {
        $reservation = $this->createReservation($this->createAssociation('Association A'));

        $this->upload($reservation, $this->fixtures->pdf());

        $this->assertResponseStatusCodeSame(401);
        $this->assertStorageIsEmpty();
    }

    public function testUserWithoutAssociationIsForbidden(): void
    {
        $reservation = $this->createReservation($this->createAssociation('Association A'));
        $this->authenticate((new User())
            ->setEmail('sans.association@example.test')
            ->setNom('Sans')
            ->setPrenom('Association')
            ->setTypeCompte('association')
            ->setIsVerified(true));

        $this->upload($reservation, $this->fixtures->pdf());

        $this->assertResponseStatusCodeSame(403);
        $this->assertStorageIsEmpty();
    }

    public function testAnotherAssociationsReservationIsNotFound(): void
    {
        $reservation = $this->createReservation($this->createAssociation('Association A'));
        $this->authenticateAsMember($this->createAssociation('Association B'));

        $this->upload($reservation, $this->fixtures->pdf());

        $this->assertResponseStatusCodeSame(404);
        $this->assertStorageIsEmpty();
    }

    public function testInvalidRequestTypeIsRejected(): void
    {
        $association = $this->createAssociation('Association A');
        $reservation = $this->createReservation($association);
        $this->authenticateAsMember($association);

        $this->upload($reservation, $this->fixtures->pdf(), ['type' => 'subvention']);

        $this->assertResponseStatusCodeSame(422);
        $this->assertStorageIsEmpty();
    }

    public function testMissingFileIsRejected(): void
    {
        $association = $this->createAssociation('Association A');
        $reservation = $this->createReservation($association);
        $this->authenticateAsMember($association);

        $this->client->request('POST', $this->uploadUri($reservation), ['type' => 'materiel']);

        $this->assertResponseStatusCodeSame(400);
    }

    public function testOwnerUploadsAValidDocument(): void
    {
        $association = $this->createAssociation('Association A');
        $reservation = $this->createReservation($association);
        $this->authenticateAsMember($association);

        $this->upload($reservation, $this->fixtures->pdf('Attestation assurance.pdf'), ['typeDocument' => 'Attestation d’assurance']);

        $this->assertResponseStatusCodeSame(201);
        $document = $this->em->getRepository(DocumentJustificatif::class)->findOneBy([]);
        self::assertInstanceOf(DocumentJustificatif::class, $document);
        $this->assertJsonContains([
            'typeDocument' => 'Attestation d’assurance',
            'fichierUrl' => '/api/documents/'.$document->getId().'/download',
            'originalName' => 'Attestation assurance.pdf',
            'mimeType' => 'application/pdf',
        ]);
        self::assertStringNotContainsString($this->storageDirectory, (string) $this->client->getResponse()->getContent());
        self::assertSame($association->getId(), $document->getAssociation()?->getId());
        self::assertSame('materiel', $document->getLieAType());
        self::assertSame($reservation->getId(), $document->getLieAId());
        self::assertFileExists($this->storageDirectory.'/'.$document->getFichierUrl());
    }

    public function testDisguisedActiveContentIsRejectedAndNotStored(): void
    {
        $association = $this->createAssociation('Association A');
        $reservation = $this->createReservation($association);
        $this->authenticateAsMember($association);

        $this->upload($reservation, $this->fixtures->file('<html><script>alert(1)</script></html>', 'piece.pdf'));

        $this->assertResponseStatusCodeSame(422);
        $this->assertJsonContains(['message' => 'Seuls les formats PDF, JPEG, PNG et WebP sont autorisés.']);
        self::assertSame(0, $this->em->getRepository(DocumentJustificatif::class)->count([]));
        $this->assertStorageIsEmpty();
    }

    public function testFileAboveTenMegabytesIsRejectedAndNotStored(): void
    {
        $association = $this->createAssociation('Association A');
        $reservation = $this->createReservation($association);
        $this->authenticateAsMember($association);

        $this->upload($reservation, $this->fixtures->sized(10 * 1024 * 1024 + 1, 'gros.pdf'));

        $this->assertResponseStatusCodeSame(400);
        $this->assertStorageIsEmpty();
    }

    public function testTooLongDocumentNameLeavesNoOrphanFile(): void
    {
        $association = $this->createAssociation('Association A');
        $reservation = $this->createReservation($association);
        $this->authenticateAsMember($association);

        $this->upload($reservation, $this->fixtures->pdf(), ['typeDocument' => str_repeat('a', 101)]);

        $this->assertResponseStatusCodeSame(422);
        self::assertSame(0, $this->em->getRepository(DocumentJustificatif::class)->count([]));
        $this->assertStorageIsEmpty();
    }

    /**
     * @param array<string, string> $parameters
     */
    private function upload(ReservationMateriel $reservation, UploadedFile $file, array $parameters = []): void
    {
        $this->client->request(
            'POST',
            $this->uploadUri($reservation),
            $parameters + ['type' => 'materiel'],
            ['file' => $file],
            ['HTTP_ACCEPT' => 'application/json'],
        );
    }

    private function uploadUri(ReservationMateriel $reservation): string
    {
        return '/api/association/requests/mat-'.$reservation->getId().'/documents';
    }

    private function assertStorageIsEmpty(): void
    {
        $storedFiles = is_dir($this->storageDirectory) ? (glob($this->storageDirectory.'/*/*/*') ?: []) : [];

        self::assertSame([], $storedFiles, 'Aucun fichier ne doit rester dans le stockage privé.');
    }

    private function createAssociation(string $name): Association
    {
        $association = (new Association())->setNom($name);
        $this->em->persist($association);
        $this->em->flush();

        return $association;
    }

    private function createReservation(Association $association): ReservationMateriel
    {
        $reservation = new ReservationMateriel();
        $reservation->setAssociation($association);
        $reservation->setMotifEvenement('Forum des associations');
        $reservation->setDateRetrait(new \DateTimeImmutable('2026-12-10 09:00:00'));
        $reservation->setDateRestitution(new \DateTimeImmutable('2026-12-10 18:00:00'));
        $this->em->persist($reservation);
        $this->em->flush();

        return $reservation;
    }

    private function authenticateAsMember(Association $association): void
    {
        $this->authenticate((new User())
            ->setEmail('membre.'.$association->getId().'@example.test')
            ->setNom('Membre')
            ->setPrenom('Association')
            ->setTypeCompte('association')
            ->setIsVerified(true)
            ->setAssociation($association));
    }

    private function authenticate(User $user): void
    {
        $this->em->persist($user);
        $this->em->flush();
        $this->client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer '.$this->jwtManager->create($user));
    }
}
