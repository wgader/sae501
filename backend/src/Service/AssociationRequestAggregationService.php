<?php

namespace App\Service;

use App\Entity\Association;
use App\Entity\DemandeStatusHistory;
use App\Entity\DemandeSubvention;
use App\Entity\DocumentJustificatif;
use App\Entity\ReservationMateriel;
use App\Entity\ReservationSalle;
use App\Repository\DemandeStatusHistoryRepository;
use App\Repository\DemandeSubventionRepository;
use App\Repository\DocumentJustificatifRepository;
use App\Repository\ReservationMaterielRepository;
use App\Repository\ReservationSalleRepository;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;

final class AssociationRequestAggregationService
{
    public const TYPE_SUBVENTION = 'subvention';
    public const TYPE_MATERIEL = 'materiel';
    public const TYPE_SALLE = 'salle';

    public const ACTIVE_STATUSES = [
        'En cours de traitement',
        'En attente',
        'Complément requis',
        'Validée',
    ];

    public const CLOSED_STATUSES = [
        'Refusée',
        'Clôturée',
        'Matériel restitué',
    ];

    public function __construct(
        private readonly DemandeSubventionRepository $subventionRepository,
        private readonly ReservationMaterielRepository $materielRepository,
        private readonly ReservationSalleRepository $salleRepository,
        private readonly DemandeStatusHistoryRepository $historyRepository,
        private readonly DocumentJustificatifRepository $documentRepository,
    ) {
    }

    /**
     * @param array{
     *   status?: string|null,
     *   type?: string|null,
     *   year?: int|string|null,
     *   search?: string|null,
     *   page?: int|null,
     *   limit?: int|null,
     * } $filters
     *
     * @return array{
     *   items: list<array<string, mixed>>,
     *   totalItems: int,
     *   page: int,
     *   limit: int,
     *   totalPages: int,
     *   counts: array<string, int>
     * }
     */
    public function getConsolidatedRequests(Association $association, array $filters = []): array
    {
        $all = [];

        // 1. Subventions
        $subventions = $this->subventionRepository->findByAssociation($association);
        foreach ($subventions as $sub) {
            $all[] = $this->serializeSubventionSummary($sub);
        }

        // 2. Réservations de matériel
        $materiels = $this->materielRepository->findByAssociation($association);
        foreach ($materiels as $mat) {
            $all[] = $this->serializeMaterielSummary($mat);
        }

        // 3. Réservations de salles
        $salles = $this->salleRepository->findByAssociation($association);
        foreach ($salles as $sal) {
            $all[] = $this->serializeSalleSummary($sal);
        }

        // Global counts before status/type filtering
        $counts = [
            'all' => count($all),
            'active' => 0,
            'closed' => 0,
            'subvention' => 0,
            'materiel' => 0,
            'salle' => 0,
        ];

        foreach ($all as $item) {
            $category = $item['statusCategory'];
            if ($category === 'active') {
                $counts['active']++;
            } elseif ($category === 'closed') {
                $counts['closed']++;
            }

            $type = (string) $item['type'];
            if (isset($counts[$type])) {
                $counts[$type]++;
            }
        }

        // Filter by status
        $statusFilter = $filters['status'] ?? null;
        if ($statusFilter !== null && $statusFilter !== '' && $statusFilter !== 'all') {
            $statusLower = strtolower((string) $statusFilter);
            if ($statusLower === 'active' || $statusLower === 'en cours' || $statusLower === 'en-cours') {
                $all = array_filter($all, static fn(array $item): bool => $item['statusCategory'] === 'active');
            } elseif ($statusLower === 'closed' || $statusLower === 'clôturé' || $statusLower === 'cloture' || $statusLower === 'cloturee') {
                $all = array_filter($all, static fn(array $item): bool => $item['statusCategory'] === 'closed');
            } else {
                $all = array_filter($all, static fn(array $item): bool => mb_strtolower((string) $item['statut']) === mb_strtolower((string) $statusFilter));
            }
        }

        // Filter by type
        $typeFilter = $filters['type'] ?? null;
        if ($typeFilter !== null && $typeFilter !== '' && $typeFilter !== 'all') {
            $all = array_filter($all, static fn(array $item): bool => $item['type'] === $typeFilter);
        }

        // Filter by year
        $yearFilter = $filters['year'] ?? null;
        if ($yearFilter !== null && $yearFilter !== '' && $yearFilter !== 'all') {
            $yearInt = (int) $yearFilter;
            $all = array_filter($all, static fn(array $item): bool => $item['year'] === $yearInt);
        }

        // Filter by search
        $search = trim((string) ($filters['search'] ?? ''));
        if ($search !== '') {
            $searchLower = mb_strtolower($search);
            $all = array_filter($all, static function (array $item) use ($searchLower): bool {
                return str_contains(mb_strtolower((string) $item['intitule']), $searchLower)
                    || str_contains(mb_strtolower((string) $item['typeLabel']), $searchLower)
                    || str_contains(mb_strtolower((string) $item['statut']), $searchLower)
                    || str_contains(mb_strtolower((string) ($item['summary'] ?? '')), $searchLower);
            });
        }

        // Sort by deposit date DESC
        usort($all, static function (array $a, array $b): int {
            return strcmp((string) ($b['createdAt'] ?? ''), (string) ($a['createdAt'] ?? ''));
        });

        // Pagination
        $page = max(1, (int) ($filters['page'] ?? 1));
        $limit = max(1, min(100, (int) ($filters['limit'] ?? 10)));
        $totalItems = count($all);
        $totalPages = (int) ceil($totalItems / $limit);
        $offset = ($page - 1) * $limit;
        $pageItems = array_slice($all, $offset, $limit);

        return [
            'items' => $pageItems,
            'totalItems' => $totalItems,
            'page' => $page,
            'limit' => $limit,
            'totalPages' => $totalPages,
            'counts' => $counts,
        ];
    }

    /**
     * @return array<string, mixed>|null
     * @throws AccessDeniedException
     */
    public function getRequestDetail(Association $association, string|int $id, ?string $type = null): ?array
    {
        [$resolvedType, $resolvedId] = $this->resolveTypeAndId((string) $id, $type);

        if ($resolvedType === self::TYPE_SUBVENTION) {
            $subvention = $this->subventionRepository->find($resolvedId);
            if (!$subvention) {
                return null;
            }
            if ($subvention->getAssociation()?->getId() !== $association->getId()) {
                throw new AccessDeniedException("Ce dossier de subvention n'appartient pas à votre association.");
            }
            return $this->serializeSubventionDetail($subvention);
        }

        if ($resolvedType === self::TYPE_MATERIEL) {
            $materiel = $this->materielRepository->find($resolvedId);
            if (!$materiel) {
                return null;
            }
            if ($materiel->getAssociation()?->getId() !== $association->getId()) {
                throw new AccessDeniedException("Cette réservation de matériel n'appartient pas à votre association.");
            }
            return $this->serializeMaterielDetail($materiel);
        }

        if ($resolvedType === self::TYPE_SALLE) {
            $salle = $this->salleRepository->find($resolvedId);
            if (!$salle) {
                return null;
            }
            if ($salle->getAssociation()?->getId() !== $association->getId()) {
                throw new AccessDeniedException("Cette réservation de salle n'appartient pas à votre association.");
            }
            return $this->serializeSalleDetail($salle);
        }

        // If type was not determinable, search across all 3
        $mat = $this->materielRepository->find($resolvedId);
        if ($mat) {
            if ($mat->getAssociation()?->getId() !== $association->getId()) {
                throw new AccessDeniedException("Ce dossier n'appartient pas à votre association.");
            }
            return $this->serializeMaterielDetail($mat);
        }

        $sub = $this->subventionRepository->find($resolvedId);
        if ($sub) {
            if ($sub->getAssociation()?->getId() !== $association->getId()) {
                throw new AccessDeniedException("Ce dossier n'appartient pas à votre association.");
            }
            return $this->serializeSubventionDetail($sub);
        }

        $sal = $this->salleRepository->find($resolvedId);
        if ($sal) {
            if ($sal->getAssociation()?->getId() !== $association->getId()) {
                throw new AccessDeniedException("Ce dossier n'appartient pas à votre association.");
            }
            return $this->serializeSalleDetail($sal);
        }

        return null;
    }

    /**
     * @return array{0: string|null, 1: int}
     */
    private function resolveTypeAndId(string $rawId, ?string $explicitType): array
    {
        if ($explicitType !== null && $explicitType !== '') {
            return [$explicitType, (int) preg_replace('/\D/', '', $rawId)];
        }

        if (preg_match('/^(sub|subvention)[-_](\d+)$/i', $rawId, $m)) {
            return [self::TYPE_SUBVENTION, (int) $m[2]];
        }

        if (preg_match('/^(mat|materiel)[-_](\d+)$/i', $rawId, $m)) {
            return [self::TYPE_MATERIEL, (int) $m[2]];
        }

        if (preg_match('/^(sal|salle)[-_](\d+)$/i', $rawId, $m)) {
            return [self::TYPE_SALLE, (int) $m[2]];
        }

        return [null, (int) $rawId];
    }

    public static function classifyStatus(string $status): string
    {
        return in_array($status, self::CLOSED_STATUSES, true) ? 'closed' : 'active';
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeSubventionSummary(DemandeSubvention $subvention): array
    {
        $id = $subvention->getId() ?? 0;
        $statusCategory = self::classifyStatus($subvention->getStatut());
        $createdAt = $subvention->getCreatedAt();
        $year = $subvention->getAnneeExercice();

        return [
            'id' => 'sub-' . $id,
            'rawId' => $id,
            'type' => self::TYPE_SUBVENTION,
            'typeLabel' => 'Subvention',
            'intitule' => $subvention->getIntituleProjet() ?? 'Demande de subvention',
            'statut' => $subvention->getStatut(),
            'statusCategory' => $statusCategory,
            'createdAt' => $createdAt?->format(\DateTimeInterface::ATOM),
            'year' => $year,
            'keyDates' => [
                'depot' => $createdAt?->format(\DateTimeInterface::ATOM),
                'exercice' => (string) $year,
            ],
            'decisionMotif' => $subvention->getObservations(),
            'observations' => $subvention->getObservations(),
            'summary' => sprintf('%s € demandés', number_format((float) $subvention->getMontantDemande(), 2, ',', ' ')),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeMaterielSummary(ReservationMateriel $materiel): array
    {
        $id = $materiel->getId() ?? 0;
        $statusCategory = self::classifyStatus($materiel->getStatut());
        $createdAt = $materiel->getCreatedAt();
        $year = (int) ($createdAt ? $createdAt->format('Y') : date('Y'));

        $itemsSummary = [];
        foreach ($materiel->getLignes() as $ligne) {
            $itemsSummary[] = sprintf('%dx %s', $ligne->getQuantite(), $ligne->getMateriel()?->getDesignation() ?? 'Matériel');
        }

        return [
            'id' => 'mat-' . $id,
            'rawId' => $id,
            'type' => self::TYPE_MATERIEL,
            'typeLabel' => 'Matériel',
            'intitule' => $materiel->getMotifEvenement() ?? 'Réservation de matériel',
            'statut' => $materiel->getStatut(),
            'statusCategory' => $statusCategory,
            'createdAt' => $createdAt?->format(\DateTimeInterface::ATOM),
            'year' => $year,
            'keyDates' => [
                'depot' => $createdAt?->format(\DateTimeInterface::ATOM),
                'retrait' => $materiel->getDateRetrait()?->format(\DateTimeInterface::ATOM),
                'restitution' => $materiel->getDateRestitution()?->format(\DateTimeInterface::ATOM),
            ],
            'decisionMotif' => $materiel->getObservations(),
            'observations' => $materiel->getObservations(),
            'summary' => $itemsSummary !== [] ? implode(', ', $itemsSummary) : 'Matériel communal',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeSalleSummary(ReservationSalle $salle): array
    {
        $id = $salle->getId() ?? 0;
        $statusCategory = self::classifyStatus($salle->getStatut());
        $createdAt = $salle->getCreatedAt();
        $year = (int) ($createdAt ? $createdAt->format('Y') : date('Y'));

        return [
            'id' => 'sal-' . $id,
            'rawId' => $id,
            'type' => self::TYPE_SALLE,
            'typeLabel' => 'Salle',
            'intitule' => $salle->getMotifEvenement() ?? 'Réservation de salle',
            'statut' => $salle->getStatut(),
            'statusCategory' => $statusCategory,
            'createdAt' => $createdAt?->format(\DateTimeInterface::ATOM),
            'year' => $year,
            'keyDates' => [
                'depot' => $createdAt?->format(\DateTimeInterface::ATOM),
                'debut' => $salle->getDateDebut()?->format(\DateTimeInterface::ATOM),
                'fin' => $salle->getDateFin()?->format(\DateTimeInterface::ATOM),
            ],
            'decisionMotif' => $salle->getObservations(),
            'observations' => $salle->getObservations(),
            'summary' => $salle->getSalle()?->getNom() ?? 'Salle communale',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeSubventionDetail(DemandeSubvention $sub): array
    {
        $id = $sub->getId() ?? 0;
        $summary = $this->serializeSubventionSummary($sub);
        $documents = $this->findDocuments(self::TYPE_SUBVENTION, $id);
        $timeline = $this->buildTimeline(self::TYPE_SUBVENTION, $id, $sub->getStatut(), $sub->getCreatedAt(), $sub->getObservations());

        return array_merge($summary, [
            'typeSubvention' => $sub->getTypeSubvention(),
            'description' => $sub->getDescription(),
            'montantDemande' => (float) $sub->getMontantDemande(),
            'montantAccorde' => $sub->getMontantAccorde() !== null ? (float) $sub->getMontantAccorde() : null,
            'anneeExercice' => $sub->getAnneeExercice(),
            'documents' => $documents,
            'timeline' => $timeline,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeMaterielDetail(ReservationMateriel $mat): array
    {
        $id = $mat->getId() ?? 0;
        $summary = $this->serializeMaterielSummary($mat);
        $documents = $this->findDocuments(self::TYPE_MATERIEL, $id);
        $timeline = $this->buildTimeline(self::TYPE_MATERIEL, $id, $mat->getStatut(), $mat->getCreatedAt(), $mat->getObservations());

        $lignes = [];
        foreach ($mat->getLignes() as $ligne) {
            $equip = $ligne->getMateriel();
            $lignes[] = [
                'materielId' => $equip?->getId(),
                'designation' => $equip?->getDesignation() ?? 'Matériel',
                'categorie' => $equip?->getCategorie(),
                'quantite' => $ligne->getQuantite(),
                'imagePath' => $equip?->getImagePath(),
            ];
        }

        return array_merge($summary, [
            'lignes' => $lignes,
            'cautionMontant' => $mat->getCautionMontant() !== null ? (float) $mat->getCautionMontant() : null,
            'cautionPayeeAt' => $mat->getCautionPayeeAt()?->format(\DateTimeInterface::ATOM),
            'materielRetireAt' => $mat->getMaterielRetireAt()?->format(\DateTimeInterface::ATOM),
            'materielRestitueAt' => $mat->getMaterielRestitueAt()?->format(\DateTimeInterface::ATOM),
            'cautionRendueAt' => $mat->getCautionRendueAt()?->format(\DateTimeInterface::ATOM),
            'documents' => $documents,
            'timeline' => $timeline,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeSalleDetail(ReservationSalle $sal): array
    {
        $id = $sal->getId() ?? 0;
        $summary = $this->serializeSalleSummary($sal);
        $documents = $this->findDocuments(self::TYPE_SALLE, $id);
        $timeline = $this->buildTimeline(self::TYPE_SALLE, $id, $sal->getStatut(), $sal->getCreatedAt(), $sal->getObservations());

        $salleEntity = $sal->getSalle();

        return array_merge($summary, [
            'salleId' => $salleEntity?->getId(),
            'salleNom' => $salleEntity?->getNom(),
            'salleAdresse' => $salleEntity?->getAdresse(),
            'salleCapaciteMax' => $salleEntity?->getCapaciteMax(),
            'salleAccesPmr' => $salleEntity?->isAccesPmr(),
            'salleEquipements' => $salleEntity?->getEquipementsInclus(),
            'capaciteAttendue' => $sal->getCapaciteAttendue(),
            'documents' => $documents,
            'timeline' => $timeline,
        ]);
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function findDocuments(string $type, int $id): array
    {
        $docs = $this->documentRepository->findByLinkedEntity($type, $id);
        return array_map(static fn(DocumentJustificatif $doc): array => [
            'id' => $doc->getId(),
            'typeDocument' => $doc->getTypeDocument(),
            'fichierUrl' => $doc->getFichierUrl(),
            'description' => $doc->getDescription(),
            'createdAt' => $doc->getCreatedAt()?->format(\DateTimeInterface::ATOM),
        ], $docs);
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function buildTimeline(
        string $type,
        int $id,
        string $currentStatus,
        ?\DateTimeImmutable $createdAt,
        ?string $observations
    ): array {
        $events = $this->historyRepository->findTimeline($type, $id);

        if ($events !== []) {
            return array_map(static fn(DemandeStatusHistory $h): array => [
                'id' => $h->getId(),
                'statut' => $h->getStatut(),
                'label' => $h->getLabel(),
                'commentaire' => $h->getCommentaire(),
                'auteur' => $h->getAuteur() ?? 'Mairie de Feytiat',
                'date' => $h->getCreatedAt()->format(\DateTimeInterface::ATOM),
            ], $events);
        }

        // Synthesize default coherent timeline if no events stored yet
        $timeline = [];
        $created = $createdAt ?? new \DateTimeImmutable();

        $timeline[] = [
            'statut' => 'En attente',
            'label' => 'Dépôt de la démarche',
            'commentaire' => 'Dossier transmis aux services municipaux de la mairie de Feytiat.',
            'auteur' => 'Association',
            'date' => $created->format(\DateTimeInterface::ATOM),
        ];

        if ($currentStatus !== 'En attente' && $currentStatus !== 'En cours de traitement') {
            $updatedDate = $created->modify('+1 day');
            $label = match ($currentStatus) {
                'Complément requis' => 'Demande de complément de dossier',
                'Validée' => 'Dossier validé par les services municipaux',
                'Refusée' => 'Dossier refusé par la commune',
                'Matériel restitué' => 'Matériel restitué et contrôlé',
                'Clôturée' => 'Dossier clôturé',
                default => 'Mise à jour du dossier',
            };

            $timeline[] = [
                'statut' => $currentStatus,
                'label' => $label,
                'commentaire' => $observations ?? 'Statut mis à jour.',
                'auteur' => 'Mairie de Feytiat',
                'date' => $updatedDate->format(\DateTimeInterface::ATOM),
            ];
        }

        return $timeline;
    }
}
