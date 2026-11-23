<?php

declare(strict_types=1);

namespace App\Tests\Controller;

use App\Entity\Association;
use App\Entity\DemandeSubvention;
use App\Entity\ExternalEvent;
use App\Entity\ReservationSalle;
use App\Entity\Salle;

final class AdminDashboardControllerTest extends ControllerRouteTestCase
{
    public function testDashboardRequiresAuthentication(): void
    {
        $this->assertRequiresAuthentication('GET', '/api/admin/dashboard');
    }

    public function testModuleAgentCannotOpenTheAdministratorDashboard(): void
    {
        $this->signInAgent(['ROLE_GESTION_SALLE']);
        $this->client->request('GET', '/api/admin/dashboard');

        $this->assertResponseStatusCodeSame(403);
    }

    public function testDashboardCountsWhatAwaitsADecisionAndListsTheWeek(): void
    {
        $validated = (new Association())->setNom('Club de judo')->setStatut('VALIDATED');
        $pending = (new Association())->setNom('Chorale du bourg')->setStatut('PENDING_VALIDATION');
        $room = (new Salle())
            ->setNom('Salle des fêtes')
            ->setAdresse('Place de la Mairie')
            ->setCapaciteMax(120)
            ->setAccesPmr(true)
            ->setIsActive(true)
            ->setCreatedAt(new \DateTimeImmutable())
            ->setUpdatedAt(new \DateTimeImmutable());
        $grant = (new DemandeSubvention())
            ->setAssociation($validated)
            ->setIntituleProjet('Tournoi régional')
            ->setMontantDemande('1500.00')
            ->setAnneeExercice(2026);
        $draft = (new DemandeSubvention())
            ->setAssociation($validated)
            ->setIntituleProjet('Brouillon')
            ->setMontantDemande('100.00')
            ->setAnneeExercice(2026)
            ->setStatut('Brouillon');
        $pendingRoom = (new ReservationSalle())
            ->setAssociation($validated)
            ->setSalle($room)
            ->setMotifEvenement('Assemblée générale')
            ->setDateDebut(new \DateTimeImmutable('+20 days 18:00'))
            ->setDateFin(new \DateTimeImmutable('+20 days 20:00'));
        $bookedRoom = (new ReservationSalle())
            ->setAssociation($validated)
            ->setSalle($room)
            ->setMotifEvenement('Gala de fin d’année')
            ->setDateDebut(new \DateTimeImmutable('+2 days 19:00'))
            ->setDateFin(new \DateTimeImmutable('+2 days 23:00'))
            ->setStatut('Validée');
        foreach ([$validated, $pending, $room, $grant, $draft, $pendingRoom, $bookedRoom] as $entity) {
            $this->em->persist($entity);
        }
        $this->em->flush();
        $this->em->persist((new ExternalEvent())
            ->setAssoId((int) $validated->getId())
            ->setTitle('Démonstration de judo')
            ->setLocation('Gymnase')
            ->setEventType('sportif')
            ->setStartDate(new \DateTime('+1 day 14:00'))
            ->setEndTime(new \DateTime('+1 day 17:00'))
            ->setStatus('PENDING')
            ->setCreatedAt(new \DateTimeImmutable()));
        $this->em->flush();

        $this->authenticateAsAdmin();
        $this->client->request('GET', '/api/admin/dashboard');

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains([
            'pending' => ['registrations' => 1, 'grants' => 1, 'rooms' => 1, 'equipment' => 0, 'events' => 1],
            'totals' => ['associations' => 1, 'rooms' => 1, 'equipment' => 0],
            'latestRegistrations' => [['nom' => 'Chorale du bourg']],
            'agenda' => [
                ['type' => 'event', 'title' => 'Démonstration de judo', 'association' => 'Club de judo'],
                ['type' => 'room', 'title' => 'Gala de fin d’année', 'place' => 'Salle des fêtes'],
            ],
            'campaign' => null,
        ]);
    }
}
