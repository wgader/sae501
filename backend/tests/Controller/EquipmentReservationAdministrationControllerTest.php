<?php

namespace App\Tests\Controller;

use App\Entity\Association;
use App\Entity\Materiel;
use App\Entity\ReservationMateriel;
use App\Entity\ReservationMaterielLigne;

final class EquipmentReservationAdministrationControllerTest extends ControllerRouteTestCase
{
    public function testReservationAdministrationRequiresAdminAuthentication(): void
    {
        $this->assertRequiresAuthentication('GET', '/api/admin/equipment/reservations');
    }

    public function testReservationListReturnsItsPaginationContract(): void
    {
        $this->authenticateAsAdmin();
        $this->client->request('GET', '/api/admin/equipment/reservations');

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains([
            'page' => 1,
            'itemsPerPage' => 10,
            'totalItems' => 0,
            'items' => [],
        ]);
    }

    public function testEachRequestedLineCarriesTheEquipmentPhoto(): void
    {
        $this->authenticateAsAdmin();
        $association = (new Association())->setNom('Foot Club Nord')->setStatut('VALIDATED');
        $tent = (new Materiel())->setDesignation('Barnum')->setCategorie('Événementiel')->setStockTotal(10)->setImagePath('/uploads/materiel/barnum.webp');
        $reservation = (new ReservationMateriel())
            ->setAssociation($association)
            ->setMotifEvenement('Tournoi des jeunes')
            ->setDateRetrait(new \DateTimeImmutable('+10 days 09:00'))
            ->setDateRestitution(new \DateTimeImmutable('+11 days 18:00'))
            ->setStatut('En attente');
        $reservation->addLigne((new ReservationMaterielLigne())->setMateriel($tent)->setQuantite(4));
        foreach ([$association, $tent, $reservation] as $entity) {
            $this->em->persist($entity);
        }
        $this->em->flush();

        $this->client->request('GET', '/api/admin/equipment/reservations?status=En attente');

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains(['items' => [[
            'lignes' => [['designation' => 'Barnum', 'imagePath' => '/uploads/materiel/barnum.webp', 'quantite' => 4]],
        ]]]);
    }
}
