<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\GrantResource;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<GrantResource>
 */
class GrantResourceRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, GrantResource::class);
    }

    /**
     * @return GrantResource[]
     */
    public function findAllOrdered(): array
    {
        return $this->findBy([], ['displayOrder' => 'ASC', 'id' => 'ASC']);
    }
}
