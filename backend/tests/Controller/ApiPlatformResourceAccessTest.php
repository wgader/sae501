<?php

declare(strict_types=1);

namespace App\Tests\Controller;

/**
 * Les ressources génériques d'API Platform sont en lecture seule et réservées à la mairie : une
 * association ne lit jamais les données des autres et ne modifie rien par ce chemin.
 */
final class ApiPlatformResourceAccessTest extends ControllerRouteTestCase
{
    private const RESOURCES = [
        '/api/materiels',
        '/api/reservation_materiels',
        '/api/reservation_materiel_lignes',
        '/api/stock_adjustments',
        '/api/salles',
        '/api/external_events',
        '/api/external_event_files',
        '/api/demande_status_histories',
        '/api/document_justificatifs',
        '/api/demande_subventions',
        '/api/users',
    ];

    public function testAnAssociationWithEveryModuleCannotReadThem(): void
    {
        $this->signInAssociationMember(['salles', 'materiel', 'subventions', 'evenements']);

        foreach (self::RESOURCES as $uri) {
            $this->client->request('GET', $uri, [], [], ['HTTP_ACCEPT' => 'application/ld+json']);
            self::assertContains($this->client->getResponse()->getStatusCode(), [403, 405], $uri);
        }
    }

    public function testNoResourceAcceptsWritesFromAnAssociation(): void
    {
        $this->signInAssociationMember(['salles', 'materiel', 'subventions', 'evenements']);

        foreach (self::RESOURCES as $uri) {
            $this->requestJson('POST', $uri, []);
            self::assertContains($this->client->getResponse()->getStatusCode(), [403, 404, 405], 'POST '.$uri);
            $this->requestJson('DELETE', $uri.'/1');
            self::assertContains($this->client->getResponse()->getStatusCode(), [403, 404, 405], 'DELETE '.$uri);
        }
    }

    public function testTheAdministratorCanStillReadThem(): void
    {
        $this->authenticateAsAdmin();
        $this->client->request('GET', '/api/document_justificatifs', [], [], ['HTTP_ACCEPT' => 'application/ld+json']);
        $this->assertResponseIsSuccessful();
    }
}
