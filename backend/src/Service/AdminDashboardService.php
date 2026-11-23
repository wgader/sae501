<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Association;
use App\Entity\Campaign;
use App\Entity\CampaignWish;
use App\Entity\DemandeSubvention;
use App\Entity\ExternalEvent;
use App\Entity\Materiel;
use App\Entity\ReservationMateriel;
use App\Entity\ReservationSalle;
use App\Entity\Salle;
use App\Repository\CampaignRepository;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Vue d’ensemble de l’accueil administrateur : ce qui attend une décision dans chaque module,
 * l’agenda des prochains jours et l’état de la campagne de salles.
 *
 * Les statuts « à traiter » reprennent ceux des pages de chaque module, pour que les
 * compteurs de l’accueil correspondent à ce que l’agent retrouve en cliquant.
 */
final class AdminDashboardService
{
    /** Demandes de salle qui attendent encore une décision (ponctuelles et campagne). */
    private const ROOM_PENDING = ['En attente de validation par la mairie', 'En attente', 'En cours de traitement', 'Complément requis'];
    /** Même définition que la liste des demandes de matériel. */
    private const EQUIPMENT_PENDING = ['En attente', 'En cours de traitement', 'Complément requis'];
    private const AGENDA_DAYS = 7;
    private const AGENDA_LIMIT = 8;
    private const LATEST_REGISTRATIONS = 4;

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly CampaignRepository $campaignRepository,
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function overview(\DateTimeImmutable $now): array
    {
        return [
            'pending' => [
                'registrations' => $this->countIn(Association::class, 'statut', ['PENDING_VALIDATION']),
                'grants' => $this->countIn(DemandeSubvention::class, 'statut', GrantAdministrationService::PENDING_STATUSES),
                'rooms' => $this->countIn(ReservationSalle::class, 'statut', self::ROOM_PENDING),
                'equipment' => $this->countIn(ReservationMateriel::class, 'statut', self::EQUIPMENT_PENDING),
                'events' => $this->countIn(ExternalEvent::class, 'status', ['PENDING']),
            ],
            'totals' => [
                'associations' => $this->countIn(Association::class, 'statut', ['VALIDATED']),
                'rooms' => $this->count('SELECT COUNT(s.id) FROM '.Salle::class.' s WHERE s.deletedAt IS NULL'),
                'equipment' => $this->count('SELECT COUNT(m.id) FROM '.Materiel::class.' m WHERE m.isArchived = false'),
            ],
            'latestRegistrations' => $this->latestRegistrations(),
            'agenda' => $this->agenda($now),
            'campaign' => $this->campaign($now),
        ];
    }

    /**
     * @param class-string $entity
     * @param list<string> $values
     */
    private function countIn(string $entity, string $field, array $values): int
    {
        return (int) $this->entityManager->createQuery(\sprintf('SELECT COUNT(x.id) FROM %s x WHERE x.%s IN (:values)', $entity, $field))
            ->setParameter('values', $values)
            ->getSingleScalarResult();
    }

    private function count(string $dql): int
    {
        return (int) $this->entityManager->createQuery($dql)->getSingleScalarResult();
    }

    /**
     * @return list<array{id: int|null, nom: string|null, createdAt: string|null, contact: string|null}>
     */
    private function latestRegistrations(): array
    {
        /** @var list<Association> $associations */
        $associations = $this->entityManager->getRepository(Association::class)->findBy(
            ['statut' => 'PENDING_VALIDATION'],
            ['createdAt' => 'DESC'],
            self::LATEST_REGISTRATIONS,
        );

        return array_map(static function (Association $association): array {
            $contact = $association->getUsers()->first() ?: null;

            return [
                'id' => $association->getId(),
                'nom' => $association->getNom(),
                'createdAt' => $association->getCreatedAt()?->format(\DateTimeInterface::ATOM),
                'contact' => $contact ? trim($contact->getPrenom().' '.$contact->getNom()) : null,
            ];
        }, $associations);
    }

    /**
     * Ce qui se passe dans les prochains jours : salles occupées, matériel à remettre, évènements.
     *
     * @return list<array{type: string, id: int|null, title: string, place: string|null, association: string|null, startsAt: string}>
     */
    private function agenda(\DateTimeImmutable $now): array
    {
        $from = $now->setTime(0, 0);
        $until = $from->modify('+'.self::AGENDA_DAYS.' days');
        $items = [];

        /** @var list<ReservationSalle> $rooms */
        $rooms = $this->entityManager->createQuery('SELECT r, s, a FROM '.ReservationSalle::class.' r JOIN r.salle s JOIN r.association a WHERE r.statut = :status AND r.dateDebut >= :from AND r.dateDebut < :until')
            ->setParameter('status', 'Validée')
            ->setParameter('from', $from)
            ->setParameter('until', $until)
            ->getResult();
        foreach ($rooms as $room) {
            $items[] = [
                'type' => 'room',
                'id' => $room->getId(),
                'title' => (string) $room->getMotifEvenement(),
                'place' => $room->getSalle()?->getNom(),
                'association' => $room->getAssociation()?->getNom(),
                'startsAt' => $room->getDateDebut()?->format(\DateTimeInterface::ATOM) ?? '',
            ];
        }

        /** @var list<ReservationMateriel> $equipment */
        $equipment = $this->entityManager->createQuery('SELECT r, a FROM '.ReservationMateriel::class.' r JOIN r.association a WHERE r.statut = :status AND r.dateRetrait >= :from AND r.dateRetrait < :until')
            ->setParameter('status', 'Validée')
            ->setParameter('from', $from)
            ->setParameter('until', $until)
            ->getResult();
        foreach ($equipment as $booking) {
            $items[] = [
                'type' => 'equipment',
                'id' => $booking->getId(),
                'title' => (string) $booking->getMotifEvenement(),
                'place' => null,
                'association' => $booking->getAssociation()?->getNom(),
                'startsAt' => $booking->getDateRetrait()?->format(\DateTimeInterface::ATOM) ?? '',
            ];
        }

        /** @var list<ExternalEvent> $events */
        $events = $this->entityManager->createQuery('SELECT e FROM '.ExternalEvent::class.' e WHERE e.start_date >= :from AND e.start_date < :until')
            ->setParameter('from', \DateTime::createFromImmutable($from))
            ->setParameter('until', \DateTime::createFromImmutable($until))
            ->getResult();
        $associationNames = $this->associationNames(array_map(static fn (ExternalEvent $event): int => (int) $event->getAssoId(), $events));
        foreach ($events as $event) {
            $items[] = [
                'type' => 'event',
                'id' => $event->getId(),
                'title' => (string) $event->getTitle(),
                'place' => $event->getLocation(),
                'association' => $associationNames[(int) $event->getAssoId()] ?? null,
                'startsAt' => $event->getStartDate()?->format(\DateTimeInterface::ATOM) ?? '',
            ];
        }

        usort($items, static fn (array $a, array $b): int => strcmp($a['startsAt'], $b['startsAt']));

        return \array_slice($items, 0, self::AGENDA_LIMIT);
    }

    /**
     * Les évènements ne portent que l’identifiant de l’association : un seul aller-retour pour les noms.
     *
     * @param list<int> $ids
     *
     * @return array<int, string>
     */
    private function associationNames(array $ids): array
    {
        if ([] === $ids) {
            return [];
        }

        $names = [];
        foreach ($this->entityManager->getRepository(Association::class)->findBy(['id' => array_values(array_unique($ids))]) as $association) {
            $names[(int) $association->getId()] = (string) $association->getNom();
        }

        return $names;
    }

    /**
     * @return array{id: int|null, seasonLabel: string|null, status: string, openingAt: string|null, closingAt: string|null, pendingWishes: int}|null
     */
    private function campaign(\DateTimeImmutable $now): ?array
    {
        $campaign = $this->campaignRepository->findCurrentState($now);
        if (null === $campaign || Campaign::STATUS_CLOSED === $campaign->getStatus()) {
            return null;
        }

        $pendingWishes = (int) $this->entityManager->createQuery('SELECT COUNT(w.id) FROM '.CampaignWish::class.' w JOIN w.submission s WHERE s.campaign = :campaign AND w.status = :status')
            ->setParameter('campaign', $campaign)
            ->setParameter('status', CampaignWish::STATUS_PENDING)
            ->getSingleScalarResult();

        return [
            'id' => $campaign->getId(),
            'seasonLabel' => $campaign->getSeasonLabel(),
            'status' => $campaign->getStatus(),
            'openingAt' => $campaign->getOpeningAt()?->format(\DateTimeInterface::ATOM),
            'closingAt' => $campaign->getClosingAt()?->format(\DateTimeInterface::ATOM),
            'pendingWishes' => $pendingWishes,
        ];
    }
}
