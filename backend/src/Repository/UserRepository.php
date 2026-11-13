<?php

namespace App\Repository;

use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Security\Core\Exception\UnsupportedUserException;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\PasswordUpgraderInterface;

/**
 * @extends ServiceEntityRepository<User>
 */
class UserRepository extends ServiceEntityRepository implements PasswordUpgraderInterface
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, User::class);
    }

    /**
     * Used to upgrade (rehash) the user's password automatically over time.
     */
    public function upgradePassword(PasswordAuthenticatedUserInterface $user, string $newHashedPassword): void
    {
        if (!$user instanceof User) {
            throw new UnsupportedUserException(sprintf('Instances of "%s" are not supported.', $user::class));
        }

        $user->setPassword($newHashedPassword);
        $this->getEntityManager()->persist($user);
        $this->getEntityManager()->flush();
    }

    /**
     * @return list<User>
     */
    public function findAgents(?string $status, int $page, int $itemsPerPage, ?string $search = null): array
    {
        $queryBuilder = $this->createQueryBuilder('user')
            ->andWhere('user.roles NOT LIKE :associationRole')
            ->andWhere('user.deletedAt IS NULL')
            ->setParameter('associationRole', '%ROLE_ASSOCIATION%')
            ->orderBy('user.createdAt', 'DESC')
            ->addOrderBy('user.id', 'DESC')
            ->setFirstResult(($page - 1) * $itemsPerPage)
            ->setMaxResults($itemsPerPage);

        if ($status === 'ACTIVE') {
            $queryBuilder->andWhere('user.inactivatedAt IS NULL');
        } elseif ($status === 'INACTIVE') {
            $queryBuilder->andWhere('user.inactivatedAt IS NOT NULL');
        }

        if ($search !== null && $search !== '') {
            $queryBuilder
                ->andWhere('LOWER(user.nom) LIKE :search OR LOWER(user.prenom) LIKE :search OR LOWER(user.email) LIKE :search')
                ->setParameter('search', '%' . mb_strtolower($search) . '%');
        }

        return $queryBuilder->getQuery()->getResult();
    }

    public function countAgents(?string $status, ?string $search = null): int
    {
        $queryBuilder = $this->createQueryBuilder('user')
            ->select('COUNT(user.id)')
            ->andWhere('user.roles NOT LIKE :associationRole')
            ->andWhere('user.deletedAt IS NULL')
            ->setParameter('associationRole', '%ROLE_ASSOCIATION%');

        if ($status === 'ACTIVE') {
            $queryBuilder->andWhere('user.inactivatedAt IS NULL');
        } elseif ($status === 'INACTIVE') {
            $queryBuilder->andWhere('user.inactivatedAt IS NOT NULL');
        }

        if ($search !== null && $search !== '') {
            $queryBuilder
                ->andWhere('LOWER(user.nom) LIKE :search OR LOWER(user.prenom) LIKE :search OR LOWER(user.email) LIKE :search')
                ->setParameter('search', '%' . mb_strtolower($search) . '%');
        }

        return (int) $queryBuilder->getQuery()->getSingleScalarResult();
    }

    public function findAgent(int $id): ?User
    {
        return $this->createQueryBuilder('user')
            ->andWhere('user.id = :id')
            ->andWhere('user.roles NOT LIKE :associationRole')
            ->andWhere('user.deletedAt IS NULL')
            ->setParameter('id', $id)
            ->setParameter('associationRole', '%ROLE_ASSOCIATION%')
            ->getQuery()
            ->getOneOrNullResult();
    }

    public function countAdministrators(): int
    {
        return (int) $this->createQueryBuilder('user')
            ->select('COUNT(user.id)')
            ->andWhere('user.typeCompte = :typeCompte')
            ->andWhere('user.deletedAt IS NULL')
            ->andWhere('user.roles LIKE :role')
            ->setParameter('typeCompte', 'mairie')
            ->setParameter('role', '%ROLE_ADMIN%')
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function emailBelongsToAnotherUser(string $email, ?int $userId): bool
    {
        $queryBuilder = $this->createQueryBuilder('user')
            ->select('COUNT(user.id)')
            ->andWhere('LOWER(user.email) = LOWER(:email)')
            ->setParameter('email', trim($email));

        if ($userId !== null) {
            $queryBuilder
                ->andWhere('user.id != :userId')
                ->setParameter('userId', $userId);
        }

        return (int) $queryBuilder->getQuery()->getSingleScalarResult() > 0;
    }

    /**
     * @return list<User>
     */
    public function findEventNotificationRecipients(): array
    {
        return $this->createQueryBuilder('user')
            ->andWhere('user.typeCompte = :typeCompte')
            ->andWhere('user.deletedAt IS NULL')
            ->andWhere('user.roles LIKE :eventRole OR user.roles LIKE :adminRole')
            ->setParameter('typeCompte', 'mairie')
            ->setParameter('eventRole', '%ROLE_GESTION_EVENT%')
            ->setParameter('adminRole', '%ROLE_ADMIN%')
            ->getQuery()
            ->getResult();
    }

    /**
     * Retourne les agents municipaux compétents pour traiter les réservations de salles.
     * (Agents avec ROLE_GESTION_SALLE ou ROLE_ADMIN).
     *
     * @return list<User>
     */
    public function findMunicipalAgentsForRooms(): array
    {
        $users = $this->createQueryBuilder('u')
            ->andWhere('u.typeCompte = :typeCompte')
            ->setParameter('typeCompte', 'mairie')
            ->getQuery()
            ->getResult();

        return array_values(array_filter($users, static function (User $user): bool {
            $roles = $user->getRoles();
            return in_array('ROLE_GESTION_SALLE', $roles, true) || in_array('ROLE_ADMIN', $roles, true);
        }));
    }
}
