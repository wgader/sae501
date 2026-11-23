<?php

namespace App\Tests\Controller;

use App\DataFixtures\ControllerIntegrationFixtures;
use App\Entity\Association;
use App\Entity\DemandeStatusHistory;
use App\Entity\DemandeSubvention;
use App\Entity\DocumentJustificatif;
use App\Entity\ExternalEvent;
use App\Entity\ExternalEventFile;
use App\Entity\Materiel;
use App\Entity\Notification;
use App\Entity\ReservationMateriel;
use App\Entity\ReservationMaterielLigne;
use App\Entity\ReservationSalle;
use App\Entity\Salle;
use App\Entity\User;
use App\Tests\Fixtures\FailingDocumentFlushListener;
use App\Tests\Fixtures\UploadFixtures;
use Symfony\Component\Filesystem\Filesystem;

final class AssociationAdministrationControllerTest extends ControllerRouteTestCase
{
    public function testAssociationAdministrationRequiresAdminAuthentication(): void
    {
        $this->assertRequiresAuthentication('GET', '/api/admin/associations');
    }

    public function testAssociationListReturnsItsPaginationContract(): void
    {
        $this->loadControllerFixtures();
        $this->authenticateAsFixtureAdmin();
        $this->client->request('GET', '/api/admin/associations');

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains([
            'page' => 1,
            'itemsPerPage' => 10,
            'totalItems' => 1,
            'items' => [[
                'nom' => ControllerIntegrationFixtures::ASSOCIATION_NAME,
                'statut' => 'VALIDATED',
            ]],
        ]);
    }

    public function testAdministrationDocumentNameLongerThanTheColumnIsRejectedBeforeStoring(): void
    {
        [$association, $fixtures, $storage] = $this->prepareDocumentUpload();

        try {
            $this->client->request('POST', '/api/admin/associations/'.$association->getId().'/documents', [
                'typeDocument' => str_repeat('a', 101),
            ], ['file' => $fixtures->pdf()]);
        } finally {
            $fixtures->remove();
        }

        $this->assertResponseStatusCodeSame(422);
        self::assertSame(0, $this->em->getRepository(DocumentJustificatif::class)->count([]));
        self::assertSame([], is_dir($storage) ? (glob($storage.'/*/*/*') ?: []) : []);
    }

    public function testAdministrationDocumentIsRemovedWhenTheDatabaseFails(): void
    {
        [$association, $fixtures, $storage] = $this->prepareDocumentUpload();
        FailingDocumentFlushListener::attachTo($this->em);

        try {
            $this->client->request('POST', '/api/admin/associations/'.$association->getId().'/documents', [
                'typeDocument' => 'Statuts',
            ], ['file' => $fixtures->pdf()]);
        } finally {
            $fixtures->remove();
        }

        $this->assertResponseStatusCodeSame(500);
        self::assertSame([], is_dir($storage) ? (glob($storage.'/*/*/*') ?: []) : []);
    }

    public function testDeletingAnAssociationRemovesEverythingItOwns(): void
    {
        $member = $this->signInAssociationMember(['salles', 'materiel', 'subventions', 'evenements']);
        $association = $member->getAssociation();
        self::assertInstanceOf(Association::class, $association);
        $associationId = (int) $association->getId();

        $grant = (new DemandeSubvention())
            ->setAssociation($association)
            ->setIntituleProjet('Fête du quartier')
            ->setMontantDemande('800.00')
            ->setAnneeExercice(2026);
        $equipment = (new Materiel())->setDesignation('Barnum')->setCategorie('mobilier')->setStockTotal(3);
        $equipmentBooking = (new ReservationMateriel())
            ->setAssociation($association)
            ->setMotifEvenement('Kermesse')
            ->setDateRetrait(new \DateTimeImmutable('+5 days 09:00'))
            ->setDateRestitution(new \DateTimeImmutable('+6 days 18:00'));
        $equipmentBooking->addLigne((new ReservationMaterielLigne())->setMateriel($equipment)->setQuantite(1));
        $room = (new Salle())
            ->setNom('Salle polyvalente')
            ->setAdresse('Place de la Mairie')
            ->setCapaciteMax(80)
            ->setAccesPmr(true)
            ->setIsActive(true)
            ->setCreatedAt(new \DateTimeImmutable())
            ->setUpdatedAt(new \DateTimeImmutable());
        $roomBooking = (new ReservationSalle())
            ->setAssociation($association)
            ->setSalle($room)
            ->setMotifEvenement('Assemblée générale')
            ->setDateDebut(new \DateTimeImmutable('+8 days 18:00'))
            ->setDateFin(new \DateTimeImmutable('+8 days 20:00'));
        $event = (new ExternalEvent())
            ->setAssoId($associationId)
            ->setTitle('Vide-grenier')
            ->setLocation('Parc')
            ->setEventType('festif')
            ->setStartDate(new \DateTime('+10 days'))
            ->setEndTime(new \DateTime('+10 days 4 hours'))
            ->setStatus('PENDING')
            ->setCreatedAt(new \DateTimeImmutable());
        $document = (new DocumentJustificatif())
            ->setAssociation($association)
            ->setTypeDocument('Statuts')
            ->setFichierUrl('absent/statuts.pdf');
        $notification = (new Notification())
            ->setUser($member)
            ->setTitle('Bienvenue')
            ->setMessage('Votre compte est actif.')
            ->setType('INFO');

        foreach ([$grant, $equipment, $equipmentBooking, $room, $roomBooking, $event, $document, $notification] as $entity) {
            $this->em->persist($entity);
        }
        $this->em->flush();
        $this->em->persist((new ExternalEventFile())
            ->setEventId((int) $event->getId())
            ->setFilePath('absent/programme.pdf')
            ->setFileType('pdf')
            ->setOriginalName('programme.pdf')
            ->setMimeType('application/pdf')
            ->setFileSize(10)
            ->setSha256(str_repeat('a', 64)));
        $this->em->persist(new DemandeStatusHistory('salle', (int) $roomBooking->getId(), 'En attente', 'Demande envoyée'));
        $this->em->flush();

        // SQLite n’applique les clés étrangères que sur demande : on reproduit le comportement de MySQL.
        $this->em->getConnection()->executeStatement('PRAGMA foreign_keys = ON');
        $this->authenticateAsAdmin();
        $this->client->request('DELETE', '/api/admin/associations/'.$associationId);

        $this->assertResponseStatusCodeSame(204);
        $this->em->clear();
        self::assertNull($this->em->find(Association::class, $associationId));
        foreach ([User::class, DemandeSubvention::class, ReservationMateriel::class, ReservationSalle::class, ExternalEvent::class, ExternalEventFile::class, DocumentJustificatif::class, Notification::class, DemandeStatusHistory::class] as $entity) {
            $remaining = User::class === $entity
                ? $this->em->getRepository(User::class)->count(['association' => $associationId])
                : $this->em->getRepository($entity)->count([]);
            self::assertSame(0, $remaining, $entity.' aurait dû être supprimé.');
        }
        // Le matériel et la salle appartiennent à la mairie : ils restent.
        self::assertSame(1, $this->em->getRepository(Materiel::class)->count([]));
        self::assertSame(1, $this->em->getRepository(Salle::class)->count([]));
    }

    public function testDeletingAnUnknownAssociationReturnsNotFound(): void
    {
        $this->authenticateAsAdmin();
        $this->client->request('DELETE', '/api/admin/associations/999999');

        $this->assertResponseStatusCodeSame(404);
    }

    /**
     * @return array{Association, UploadFixtures, string}
     */
    private function prepareDocumentUpload(): array
    {
        $storage = static::getContainer()->getParameter('app.private_document_directory');
        self::assertIsString($storage);
        (new Filesystem())->remove($storage);

        $association = (new Association())->setNom('Comité des fêtes');
        $this->em->persist($association);
        $this->em->flush();
        $this->authenticateAsAdmin();

        return [$association, new UploadFixtures(), $storage];
    }
}
