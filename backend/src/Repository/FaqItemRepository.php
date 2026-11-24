<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\FaqItemRepository as EntityRepo;
use App\Entity\FaqItem;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<FaqItem>
 */
class FaqItemRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, FaqItem::class);
    }

    /**
     * @return FaqItem[]
     */
    public function findAllOrdered(): array
    {
        return $this->findBy([], ['displayOrder' => 'ASC', 'id' => 'ASC']);
    }
}
