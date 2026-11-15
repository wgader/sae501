<?php

namespace App\Tests\Controller;

use App\DataFixtures\ControllerIntegrationFixtures;
use App\Entity\Association;
use App\Entity\DocumentJustificatif;
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
