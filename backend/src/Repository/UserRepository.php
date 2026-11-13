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
