<?php

namespace App\Tests\Controller;

use App\DataFixtures\ControllerIntegrationFixtures;

final class SalleAdministrationControllerTest extends ControllerRouteTestCase
{
    public function testRoomAdministrationRequiresAdminAuthentication(): void
    {
        $this->assertRequiresAuthentication('GET', '/api/admin/salles');
    }

    public function testRoomListReturnsTheFixtureRooms(): void
    {
        $this->loadControllerFixtures();
        $this->authenticateAsFixtureAdmin();
        $this->client->request('GET', '/api/admin/salles');

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains([
            [
                'nom' => ControllerIntegrationFixtures::ROOM_NAME,
                'capaciteMax' => 80,
            ],
        ]);
    }

    public function testRoomCreationValidatesRequiredFields(): void
    {
        $this->authenticateAsAdmin();
        $this->requestJson('POST', '/api/admin/salles', []);

        $this->assertResponseStatusCodeSame(422);
        $this->assertJsonContains([
            'errors' => [
                'nom' => 'Le nom de la salle est obligatoire.',
                'adresse' => "L'adresse doit contenir une voie, un code postal à 5 chiffres et une ville.",
            ],
        ]);
    }

    public function testRoomCanBeCreatedAndThenArchived(): void
    {
        $this->authenticateAsAdmin();
        $this->requestJson('POST', '/api/admin/salles', [
            'nom' => 'Salle polyvalente',
            'adresse' => '1 rue de la Mairie, 87220 Feytiat',
            'capaciteMax' => 80,
            'accesPmr' => true,
            'equipementsInclus' => ['projecteur'],
        ]);

        $this->assertResponseStatusCodeSame(201);
        $room = json_decode((string) $this->client->getResponse()->getContent(), true);
        $this->assertSame('Salle polyvalente', $room['nom']);
        $this->assertSame(80, $room['capaciteMax']);

        $this->client->request('DELETE', '/api/admin/salles/' . $room['id']);

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains([
            'nom' => 'Salle polyvalente',
            'isActive' => false,
        ]);
    }

    public function testRoomStatusRejectsNonBooleanValues(): void
    {
        $this->authenticateAsAdmin();
        $this->requestJson('POST', '/api/admin/salles', [
            'nom' => 'Salle à modifier',
            'adresse' => '2 rue des Sports, 87220 Feytiat',
            'capaciteMax' => 40,
            'accesPmr' => false,
            'equipementsInclus' => [],
        ]);
        $room = json_decode((string) $this->client->getResponse()->getContent(), true);

        $this->requestJson('PATCH', '/api/admin/salles/' . $room['id'] . '/status', [
            'isActive' => 'yes',
        ]);

        $this->assertResponseStatusCodeSame(422);
        $this->assertJsonContains([
            'errors' => ['isActive' => 'Le champ isActive doit être un booléen.'],
        ]);
    }
}
