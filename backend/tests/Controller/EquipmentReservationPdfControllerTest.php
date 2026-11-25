<?php

declare(strict_types=1);

namespace App\Tests\Controller;

use App\Entity\Association;
use App\Entity\Materiel;
use App\Entity\ReservationMateriel;
use App\Entity\ReservationMaterielLigne;
use App\Entity\User;

final class EquipmentReservationPdfControllerTest extends ControllerRouteTestCase
{
    public function testPdfRequiresAuthentication(): void
    {
        $reservation = $this->createReservation('Validée');

        $this->assertRequiresAuthentication('GET', '/api/equipment/reservations/'.$reservation->getId().'/pdf');
    }

    public function testAnotherAssociationCannotDownloadPdf(): void
    {
        $reservation = $this->createReservation('Validée');
        $otherAssociation = (new Association())->setNom('Autre association')->setStatut('VALIDATED');
        $member = (new User())
            ->setEmail('autre@example.test')
            ->setNom('Autre')
            ->setPrenom('Utilisateur')
            ->setTypeCompte('association')
            ->setRoles(['ROLE_ASSOCIATION'])
            ->setIsVerified(true)
            ->setAssociation($otherAssociation);
        $this->em->persist($otherAssociation);
        $this->em->persist($member);
        $this->em->flush();
        $this->client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer '.$this->jwtManager->create($member));

        $this->client->request('GET', '/api/equipment/reservations/'.$reservation->getId().'/pdf');

        $this->assertResponseStatusCodeSame(403);
    }

    public function testOfficialPdfIsUnavailableBeforeValidation(): void
    {
        $reservation = $this->createReservation('En attente');
        $owner = $reservation->getAssociation()->getUsers()->first();
        self::assertInstanceOf(User::class, $owner);
        $this->client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer '.$this->jwtManager->create($owner));

        $this->client->request('GET', '/api/equipment/reservations/'.$reservation->getId().'/pdf');

        $this->assertResponseStatusCodeSame(422);
    }

    public function testAssociationCannotDownloadProvisionalPdf(): void
    {
        $reservation = $this->createReservation('En attente');
        $owner = $reservation->getAssociation()->getUsers()->first();
        self::assertInstanceOf(User::class, $owner);
        $this->client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer '.$this->jwtManager->create($owner));

        $this->client->request('GET', '/api/equipment/reservations/'.$reservation->getId().'/pdf?provisional=1');

        $this->assertResponseStatusCodeSame(403);
    }

    public function testAgentCanRequestProvisionalPdfForPendingReservation(): void
    {
        $reservation = $this->createReservation('En attente');
        $this->authenticateAsAdmin();

        $this->client->request('GET', '/api/equipment/reservations/'.$reservation->getId().'/pdf?provisional=1');

        // Dompdf génère le document dans l’application : aucun service externe n’est requis.
        $this->assertResponseIsSuccessful();
        $this->assertResponseHeaderSame('Content-Type', 'application/pdf');
        self::assertStringContainsString('bon-reservation-provisoire-', (string) $this->client->getResponse()->headers->get('Content-Disposition'));
        self::assertStringStartsWith('%PDF-', (string) $this->client->getResponse()->getContent());
        self::assertStringContainsString('no-store', (string) $this->client->getResponse()->headers->get('Cache-Control'));
    }

    private function createReservation(string $status): ReservationMateriel
    {
        $association = (new Association())
            ->setNom('Association des tests')
            ->setStatut('VALIDATED')
            ->setModuleMaterielActif(true);
        $member = (new User())
            ->setEmail('association@example.test')
            ->setNom('Dupont')
            ->setPrenom('Alice')
            ->setTelephone('0612345678')
            ->setTypeCompte('association')
            ->setRoles(['ROLE_ASSOCIATION'])
            ->setIsVerified(true)
            ->setAssociation($association);
        $association->addUser($member);

        $equipment = (new Materiel())
            ->setDesignation('Table pliante')
            ->setCategorie('Mobilier')
            ->setReferenceInterne('TAB-001')
            ->setStockTotal(10);

        $reservation = (new ReservationMateriel())
            ->setAssociation($association)
            ->setMotifEvenement('Assemblée générale')
            ->setDateRetrait(new \DateTimeImmutable('2030-06-10 09:00:00', new \DateTimeZone('Europe/Paris')))
            ->setDateRestitution(new \DateTimeImmutable('2030-06-10 18:00:00', new \DateTimeZone('Europe/Paris')))
            ->setCautionMontant('150.00')
            ->setStatut($status);
        $reservation->addLigne(
            (new ReservationMaterielLigne())
                ->setMateriel($equipment)
                ->setQuantite(4),
        );

        foreach ([$association, $member, $equipment, $reservation] as $entity) {
            $this->em->persist($entity);
        }
        $this->em->flush();

        return $reservation;
    }
}
