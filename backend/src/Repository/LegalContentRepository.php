<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\LegalContent;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<LegalContent>
 */
class LegalContentRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, LegalContent::class);
    }

    public function findByType(string $type): ?LegalContent
    {
        return $this->findOneBy(['type' => $type]);
    }
}
