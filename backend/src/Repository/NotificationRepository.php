<?php

namespace App\Repository;

use App\Entity\Notification;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/** @extends ServiceEntityRepository<Notification> */
class NotificationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Notification::class);
    }

    /** @return list<Notification> */
    public function findForUser(User $user, int $page, int $limit): array
    {
        return $this->createQueryBuilder('n')
            ->andWhere('n.user = :user')->setParameter('user', $user)
            ->orderBy('n.createdAt', 'DESC')->addOrderBy('n.id', 'DESC')
            ->setFirstResult(($page - 1) * $limit)->setMaxResults($limit)
            ->getQuery()->getResult();
    }

    public function countForUser(User $user): int
    {
        return (int) $this->createQueryBuilder('n')
            ->select('COUNT(n.id)')->andWhere('n.user = :user')
            ->setParameter('user', $user)->getQuery()->getSingleScalarResult();
    }

    public function countUnreadForUser(User $user): int
    {
        return (int) $this->createQueryBuilder('n')
            ->select('COUNT(n.id)')->andWhere('n.user = :user')->andWhere('n.readAt IS NULL')
            ->setParameter('user', $user)->getQuery()->getSingleScalarResult();
    }

    public function findOneForUser(int $id, User $user): ?Notification
    {
        return $this->findOneBy(['id' => $id, 'user' => $user]);
    }

    public function markAllAsRead(User $user): int
    {
        return $this->createQueryBuilder('n')->update()
            ->set('n.readAt', ':now')->andWhere('n.user = :user')->andWhere('n.readAt IS NULL')
            ->setParameter('now', new \DateTimeImmutable())->setParameter('user', $user)
            ->getQuery()->execute();
    }
}
