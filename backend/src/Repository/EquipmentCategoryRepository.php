<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\EquipmentCategory;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<EquipmentCategory>
 */
class EquipmentCategoryRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, EquipmentCategory::class);
    }

    /**
     * @return list<EquipmentCategory>
     */
    public function findAllOrdered(): array
    {
        /* @var list<EquipmentCategory> */
        return $this->createQueryBuilder('c')->orderBy('c.label', 'ASC')->getQuery()->getResult();
    }

    public function findOneByLabelInsensitive(string $label): ?EquipmentCategory
    {
        /* @var EquipmentCategory|null */
        return $this->createQueryBuilder('c')
            ->andWhere('LOWER(c.label) = :label')
            ->setParameter('label', mb_strtolower($label))
            ->getQuery()
            ->getOneOrNullResult();
    }
}
