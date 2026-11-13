<?php

declare(strict_types=1);

namespace App\DataFixtures;

use App\Entity\Association;
use App\Entity\Materiel;
use App\Entity\Salle;
use App\Entity\User;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;

final class ControllerIntegrationFixtures extends Fixture
{
    public const ADMIN_EMAIL = 'fixture.admin@feytiat.test';
    public const ASSOCIATION_EMAIL = 'fixture.association@feytiat.test';
    public const ASSOCIATION_NAME = 'Les Amis du Parc';
    public const EQUIPMENT_REFERENCE = 'TAB-FIXTURE-001';
    public const ROOM_NAME = 'Salle des Associations';

    public function load(ObjectManager $manager): void
    {
        $admin = (new User())
            ->setEmail(self::ADMIN_EMAIL)
            ->setNom('Martin')
            ->setPrenom('Claire')
            ->setTypeCompte('mairie')
            ->setRoles(['ROLE_ADMIN'])
            ->setIsVerified(true);

        $association = (new Association())
            ->setNom(self::ASSOCIATION_NAME)
            ->setNombreMembres(42)
            ->setStatut('VALIDATED')
            ->setValideAt(new \DateTimeImmutable('-10 days'));

        $representative = (new User())
            ->setEmail(self::ASSOCIATION_EMAIL)
            ->setNom('Durand')
            ->setPrenom('Alex')
            ->setTelephone('0612345678')
            ->setTypeCompte('association')
            ->setRoles(['ROLE_ASSOCIATION'])
            ->setIsVerified(true);
        $association->addUser($representative);

        $availableEquipment = (new Materiel())
            ->setDesignation('Table pliante')
            ->setCategorie('mobilier')
            ->setReferenceInterne(self::EQUIPMENT_REFERENCE)
            ->setDescription('Table pliante pour les réunions associatives.')
            ->setStockTotal(12);

        $archivedEquipment = (new Materiel())
            ->setDesignation('Ancien vidéoprojecteur')
            ->setCategorie('audiovisuel')
            ->setStockTotal(0)
            ->setIsArchived(true);

        $room = (new Salle())
            ->setNom(self::ROOM_NAME)
            ->setAdresse('10 rue de la Mairie, 87220 Feytiat')
            ->setDescription('Salle accessible aux associations locales.')
            ->setCapaciteMax(80)
            ->setAccesPmr(true)
            ->setEquipementsInclus(['projecteur', 'tables'])
            ->setCreatedAt(new \DateTimeImmutable('-5 days'))
            ->setUpdatedAt(new \DateTimeImmutable('-1 day'))
            ->setIsActive(true);

        foreach ([$admin, $association, $representative, $availableEquipment, $archivedEquipment, $room] as $entity) {
            $manager->persist($entity);
        }

        $manager->flush();
    }
}
