<?php

namespace App\Repository;

use App\Entity\Salle;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Salle>
 */
class SalleRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Salle::class);
    }

    /**
     * @return list<Salle>
     */
    public function findAvailableForCatalog(): array
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.isActive = :active')
            ->andWhere('s.deletedAt IS NULL')
            ->setParameter('active', true)
            ->orderBy('s.nom', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Recherche optimisée pour la vue cartographique avec filtres dynamiques.
     *
     * @param array{
     *     capacity_min?: int|null,
     *     pmr?: bool|null,
     *     typologie?: string|null,
     *     amenities?: list<string>,
     *     bbox?: array{0: float, 1: float, 2: float, 3: float}|null
     * } $filters
     * @return list<Salle>
     */
    public function findForMap(array $filters = []): array
    {
        $qb = $this->createQueryBuilder('s')
            ->andWhere('s.isActive = :active')
            ->andWhere('s.deletedAt IS NULL')
            ->andWhere('s.latitude IS NOT NULL')
            ->andWhere('s.longitude IS NOT NULL')
            ->setParameter('active', true)
            ->orderBy('s.nom', 'ASC');

        if (!empty($filters['capacity_min'])) {
            $qb->andWhere('s.capaciteMax >= :capacityMin')
                ->setParameter('capacityMin', (int) $filters['capacity_min']);
        }

        if (isset($filters['pmr']) && true === $filters['pmr']) {
            $qb->andWhere('s.accesPmr = :pmr')
                ->setParameter('pmr', true);
        }

        if (!empty($filters['typologie']) && in_array($filters['typologie'], Salle::TYPOLOGIES, true)) {
            $qb->andWhere('s.typologie = :typologie')
                ->setParameter('typologie', $filters['typologie']);
        }

        // Bbox: [minLng, minLat, maxLng, maxLat]
        if (!empty($filters['bbox']) && 4 === count($filters['bbox'])) {
            [$minLng, $minLat, $maxLng, $maxLat] = $filters['bbox'];
            $qb->andWhere('s.longitude BETWEEN :minLng AND :maxLng')
                ->andWhere('s.latitude BETWEEN :minLat AND :maxLat')
                ->setParameter('minLng', $minLng)
                ->setParameter('maxLng', $maxLng)
                ->setParameter('minLat', $minLat)
                ->setParameter('maxLat', $maxLat);
        }

        /** @var list<Salle> $results */
        $results = $qb->getQuery()->getResult();

        // Filtrage des commodités (indépendant de la casse/accents/tirets en base)
        $requestedAmenities = $filters['amenities'] ?? [];
        if ([] === $requestedAmenities) {
            return $results;
        }

        $normalizedRequested = array_map(self::normalizeToken(...), $requestedAmenities);

        return array_values(array_filter(
            $results,
            static function (Salle $salle) use ($normalizedRequested): bool {
                $roomTokens = array_map(
                    self::normalizeToken(...),
                    $salle->getEquipementsInclus()
                );

                foreach ($normalizedRequested as $needed) {
                    if (!in_array($needed, $roomTokens, true)) {
                        return false;
                    }
                }

                return true;
            }
        ));
    }

    private static function normalizeToken(string $value): string
    {
        $clean = mb_strtolower(trim($value));
        $clean = str_replace(['é', 'è', 'ê', 'à', 'â', 'î', 'ï', 'ô', 'ù', 'û', 'ç', '-', '_', ' '], ['e', 'e', 'e', 'a', 'a', 'i', 'i', 'o', 'u', 'u', 'c', '', '', ''], $clean);

        return $clean;
    }
}