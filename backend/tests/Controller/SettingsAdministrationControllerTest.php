<?php

declare(strict_types=1);

namespace App\Tests\Controller;

use App\Entity\Materiel;

/**
 * Réglages de la mairie : accès par module, contrôle de chaque valeur côté serveur et
 * application immédiate aux démarches des associations.
 */
final class SettingsAdministrationControllerTest extends ControllerRouteTestCase
{
    public function testSettingsRequireAnAgentOfTheModule(): void
    {
        $this->assertRequiresAuthentication('GET', '/api/admin/equipment/settings');
        $this->assertRequiresAuthentication('PUT', '/api/admin/salles/settings');

        $this->signInAgent(['ROLE_MAIRIE', 'ROLE_GESTION_MATERIEL']);
        $this->requestJson('GET', '/api/admin/equipment/settings');
        $this->assertResponseIsSuccessful();
        $this->requestJson('GET', '/api/admin/salles/settings');
        $this->assertResponseStatusCodeSame(403);
        $this->requestJson('PUT', '/api/admin/salles/settings', ['openingHour' => 7, 'closingHour' => 22, 'oneOffMaxDays' => 2]);
        $this->assertResponseStatusCodeSame(403);

        $this->signInAssociationMember(['materiel', 'salles']);
        $this->requestJson('GET', '/api/admin/equipment/settings');
        $this->assertResponseStatusCodeSame(403);
        $this->requestJson('POST', '/api/admin/equipment/categories', ['label' => 'Piratage']);
        $this->assertResponseStatusCodeSame(403);
    }

    public function testRoomSettingsAreCheckedThenAppliedToBookings(): void
    {
        $this->signInAgent(['ROLE_MAIRIE', 'ROLE_GESTION_SALLE']);

        $this->requestJson('GET', '/api/admin/salles/settings');
        $this->assertJsonContains(['openingHour' => 8, 'closingHour' => 23, 'oneOffMaxDays' => 3, 'updatedAt' => null]);

        $this->requestJson('PUT', '/api/admin/salles/settings', ['openingHour' => 20, 'closingHour' => 9, 'oneOffMaxDays' => 0]);
        $this->assertResponseStatusCodeSame(422);
        $errors = $this->responseData()['errors'];
        self::assertArrayHasKey('closingHour', $errors);
        self::assertArrayHasKey('oneOffMaxDays', $errors);
        self::assertArrayNotHasKey('openingHour', $errors);

        $this->requestJson('PUT', '/api/admin/salles/settings', ['openingHour' => '9', 'closingHour' => 'vingt', 'oneOffMaxDays' => 2]);
        $this->assertResponseStatusCodeSame(422);
        self::assertArrayHasKey('closingHour', $this->responseData()['errors']);

        $this->requestJson('PUT', '/api/admin/salles/settings', ['openingHour' => 9, 'closingHour' => 20, 'oneOffMaxDays' => 2]);
        $this->assertResponseIsSuccessful();
        $this->assertJsonContains(['openingHour' => 9, 'closingHour' => 20, 'oneOffMaxDays' => 2, 'updatedBy' => 'Test Agent']);

        $this->signInAssociationMember(['salles']);
        $this->requestJson('GET', '/api/rooms/booking-rules');
        $this->assertJsonContains(['openingTime' => '09:00', 'closingTime' => '20:00', 'maxDays' => 2]);
    }

    public function testEquipmentSettingsRejectInconsistentValues(): void
    {
        $this->signInAgent(['ROLE_MAIRIE', 'ROLE_GESTION_MATERIEL']);

        $this->requestJson('PUT', '/api/admin/equipment/settings', [
            'deskOpening' => '25:00',
            'deskClosing' => '10:00',
            'pickupLocation' => str_repeat('a', 256),
            'maxQuantityPerRequest' => 0,
            'defaultMaxDays' => 91,
        ]);
        $this->assertResponseStatusCodeSame(422);
        $errors = $this->responseData()['errors'];
        foreach (['deskOpening', 'pickupLocation', 'maxQuantityPerRequest', 'defaultMaxDays'] as $field) {
            self::assertArrayHasKey($field, $errors);
        }

        $this->requestJson('PUT', '/api/admin/equipment/settings', [
            'deskOpening' => '10:00',
            'deskClosing' => '10:15',
            'pickupLocation' => null,
            'maxQuantityPerRequest' => null,
            'defaultMaxDays' => 5,
        ]);
        $this->assertResponseStatusCodeSame(422);
        self::assertArrayHasKey('deskClosing', $this->responseData()['errors']);

        $this->requestJson('PUT', '/api/admin/equipment/settings', [
            'deskOpening' => '08:30',
            'deskClosing' => '18:00',
            'pickupLocation' => '  Centre technique municipal  ',
            'maxQuantityPerRequest' => null,
            'defaultMaxDays' => 5,
        ]);
        $this->assertResponseIsSuccessful();
        $this->assertJsonContains(['deskOpening' => '08:30', 'pickupLocation' => 'Centre technique municipal', 'maxQuantityPerRequest' => null]);

        // Un nouvel équipement reprend la durée de prêt par défaut.
        $this->requestJson('POST', '/api/admin/equipment', ['designation' => 'Grille d’exposition', 'categorie' => 'signaletique-communication', 'stockTotal' => 4]);
        $this->assertResponseStatusCodeSame(201);
        $this->assertJsonContains(['maxConsecutiveDays' => 5]);
    }

    public function testCategoriesCanBeManagedWithoutBreakingTheCatalogue(): void
    {
        $this->signInAgent(['ROLE_MAIRIE', 'ROLE_GESTION_MATERIEL']);
        $this->em->persist((new Materiel())
            ->setDesignation('Barnum 3x3')
            ->setCategorie('barnums')
            ->setStockTotal(2)
            ->setCreatedAt(new \DateTimeImmutable()));
        $this->em->flush();

        $this->requestJson('GET', '/api/admin/equipment/categories');
        $this->assertResponseIsSuccessful();
        $labels = array_column($this->responseData(), 'label', 'code');
        self::assertSame('Électricité & Chauffage', $labels['electricite-chauffage']);
        self::assertSame('Cérémonies & Protocole', $labels['ceremonies-protocole']);
        self::assertCount(12, $labels);
        $barnums = array_values(array_filter($this->responseData(), static fn (array $c): bool => $c['code'] === 'barnums'))[0];
        self::assertSame(1, $barnums['equipmentCount']);

        $this->requestJson('POST', '/api/admin/equipment/categories', ['label' => '  Jeux   de société ']);
        $this->assertResponseStatusCodeSame(201);
        $this->assertJsonContains(['code' => 'jeux-de-societe', 'label' => 'Jeux de société', 'equipmentCount' => 0]);
        $created = $this->responseData()['id'];

        $this->requestJson('POST', '/api/admin/equipment/categories', ['label' => 'JEUX DE SOCIÉTÉ']);
        $this->assertResponseStatusCodeSame(422);
        $this->requestJson('POST', '/api/admin/equipment/categories', ['label' => '   ']);
        $this->assertResponseStatusCodeSame(422);
        $this->requestJson('POST', '/api/admin/equipment/categories', ['label' => str_repeat('x', 101)]);
        $this->assertResponseStatusCodeSame(422);

        $this->requestJson('PATCH', '/api/admin/equipment/categories/'.$created, ['label' => 'Jeux & Loisirs']);
        $this->assertResponseIsSuccessful();
        $this->assertJsonContains(['code' => 'jeux-de-societe', 'label' => 'Jeux & Loisirs']);

        $this->requestJson('DELETE', '/api/admin/equipment/categories/'.$barnums['id']);
        $this->assertResponseStatusCodeSame(409);
        $this->assertJsonContains(['equipmentCount' => 1]);

        $this->requestJson('DELETE', '/api/admin/equipment/categories/'.$created);
        $this->assertResponseStatusCodeSame(204);
        $this->requestJson('DELETE', '/api/admin/equipment/categories/999999');
        $this->assertResponseStatusCodeSame(404);

        $this->requestJson('POST', '/api/admin/equipment', ['designation' => 'Objet', 'categorie' => 'inconnue', 'stockTotal' => 1]);
        $this->assertResponseStatusCodeSame(400);
        self::assertArrayHasKey('categorie', $this->responseData()['errors']);

        $this->signInAssociationMember(['materiel']);
        $this->requestJson('GET', '/api/equipment/categories');
        $this->assertResponseIsSuccessful();
        self::assertContains(['code' => 'barnums', 'label' => 'Barnums & Tentes'], $this->responseData());
    }

    /**
     * @return array<mixed>
     */
    private function responseData(): array
    {
        return json_decode((string) $this->client->getResponse()->getContent(), true, flags: \JSON_THROW_ON_ERROR);
    }
}
