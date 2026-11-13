<?php

declare(strict_types=1);

namespace App\DataFixtures;

use App\Entity\Association;
use App\Entity\User;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class AppFixtures extends Fixture
{
    private const DEMO_PASSWORD = 'FeytiatDemo2026!';

    public function __construct(
        private readonly UserPasswordHasherInterface $passwordHasher,
    ) {
    }

    public function load(ObjectManager $manager): void
    {
        $validatedAt = new \DateTimeImmutable();
        $associations = [
            'Amicale des donneurs de sang bénévoles',
            "Association nationale des sous-officiers de réserve de l'Armée de l'air Limousin",
            'AS Caporaux chefs parachutistes ACCP',
            'Coccinelle Foyer APF',
            'FNACA (Fédération nationale des anciens combattants d\'Algérie)',
            'Léonarde Fayolle',
            'Restaurants du Cœur',
            'Secours Populaire',
            'Ukraine Renaissance',
            'Vétérans OPEX-ONU-OTAN France',
            'Foyer Culturel Laïque (FCL)',
            'Boules club de Feytiat',
            'CAMAF',
            'Club sportif de Feytiat',
            "Comité d'organisation de manifestations sportives",
            'Cyclo Club de Feytiat',
            'Ducati do Lemouzi',
            'Ecole de bowling',
            'Feytiat basket',
            'Feytiat Gym et Danse',
            'FUTSAL – Association sportive de Feytiat',
            'Judo Club',
            'Red Star Padel Tennis Club',
            'Shoshin-Karaté-Do Shotokan Kase-Ha',
            'Tennis Club',
            'Association philatélique limousine',
            'ACCA',
            "Association des parents d'élèves (AFPE)",
            'CAJAF',
            'Comité des fêtes',
            'Club du Mas Cerise',
            'Comice agricole cantonal des Biards',
            'Club de la figurine historique du Limousin et des amis du Maréchal Jourdan',
            'Les Copains de Feytiat',
            'OCEE',
            'Vivre au Mas Gauthier',
            "Bout d'Ficelle",
            'Ciel de Musette',
            'Comité de jumelage',
            'Conservatoire aéronautique du Limousin',
            'Félibrige',
            'La luette agile',
            'Les Pastoureaux de la Valoine',
            'Les Baladines',
            'Mélosongs',
            'Swing Music',
            'AMAP',
            "Parc d'activités des Portes de Feytiat",
            'Prévalescence',
            'Toutou’s Club 87',
            "Mobilité, sécurité, tranquillité à l'Est de Limoges",
        ];

        $firstAssociation = null;
        foreach ($associations as $index => $name) {
            $association = (new Association())
                ->setNom($name)
                ->setNombreMembres(10 + $index)
                ->setStatut('VALIDATED')
                ->setValideAt($validatedAt);

            $manager->persist($association);
            $firstAssociation ??= $association;
        }

        $admin = (new User())
            ->setEmail('admin@feytiat.test')
            ->setRoles(['ROLE_ADMIN'])
            ->setPassword(null)
            ->setNom('Administrateur')
            ->setPrenom('Demo')
            ->setTypeCompte('mairie')
            ->setIsVerified(true)
            ->setCguValidateAt($validatedAt);
        $admin->setPassword($this->passwordHasher->hashPassword($admin, self::DEMO_PASSWORD));

        $representative = (new User())
            ->setEmail('antonio.alves@feytiat.test')
            ->setRoles(['ROLE_ASSOCIATION'])
            ->setPassword(null)
            ->setNom('Alves')
            ->setPrenom('Antonio')
            ->setTelephone('0612965167')
            ->setTypeCompte('association')
            ->setIsVerified(true)
            ->setCguValidateAt($validatedAt);
        $firstAssociation->addUser($representative);
        $representative->setPassword($this->passwordHasher->hashPassword($representative, self::DEMO_PASSWORD));

        $manager->persist($admin);
        $manager->persist($representative);

        $manager->flush();
    }
}
