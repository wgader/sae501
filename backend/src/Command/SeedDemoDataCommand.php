<?php

declare(strict_types=1);

namespace App\Command;

use App\Entity\Association;
use App\Entity\Salle;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[AsCommand(
    name: 'app:seed-demo-data',
    description: 'Alimente la base avec les associations, utilisateurs et salles de démonstration.'
)]
final class SeedDemoDataCommand extends Command
{
    private const PASSWORD = 'Test123#';

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly UserPasswordHasherInterface $passwordHasher,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $now = new \DateTimeImmutable();
        $associationRepository = $this->entityManager->getRepository(Association::class);
        $userRepository = $this->entityManager->getRepository(User::class);
        $salleRepository = $this->entityManager->getRepository(Salle::class);
        $associations = [];

        foreach ($this->associationData() as $data) {
            $association = $associationRepository->findOneBy(['nom' => $data['name']]);
            if (!$association instanceof Association) {
                $association = new Association();
                $association->setNom($data['name']);
                $this->entityManager->persist($association);
            }
            $associations[$data['name']] = $association;

            foreach ($data['contacts'] as $contact) {
                $email = $this->emailFor($contact['firstName'], $contact['lastName'], $data['name']);
                $user = $userRepository->findOneBy(['email' => $email]);
                if (!$user instanceof User) {
                    $user = new User();
                    $user->setEmail($email);
                    $this->entityManager->persist($user);
                }
                $user->setNom($contact['lastName'])
                    ->setPrenom($contact['firstName'])
                    ->setTelephone($contact['phone'])
                    ->setTypeCompte('association')
                    ->setRoles(['ROLE_ASSOCIATION'])
                    ->setPassword($this->passwordHasher->hashPassword($user, self::PASSWORD))
                    ->setIsVerified(true)
                    ->setCguValidateAt($now)
                    ->setAssociation($association);
            }
        }

        foreach ($this->municipalUsers() as $data) {
            $user = $userRepository->findOneBy(['email' => $data['email']]);
            if (!$user instanceof User) {
                $user = new User();
                $user->setEmail($data['email']);
                $this->entityManager->persist($user);
            }
            $user->setNom($data['lastName'])
                ->setPrenom($data['firstName'])
                ->setTelephone(null)
                ->setTypeCompte('mairie')
                ->setRoles(array_values(array_unique([
                    'ROLE_MAIRIE',
                    ...$data['roles'],
                ])))
                ->setPassword($this->passwordHasher->hashPassword($user, self::PASSWORD))
                ->setIsVerified(true)
                ->setCguValidateAt($now)
                ->setAssociation(null);
        }

        foreach ($this->salleData() as $data) {
            $salle = $salleRepository->findOneBy(['nom' => $data['name']]);
            if (!$salle instanceof Salle) {
                $salle = new Salle();
                $salle->setNom($data['name']);
                $this->entityManager->persist($salle);
            }
            $salle->setDescription($data['description'])
                ->setAdresse('Feytiat')
                ->setCapaciteMax($data['capacity'])
                ->setAccesPmr($data['pmr'])
                ->setEquipementsInclus($data['equipment'])
                ->setCreatedAt($now)
                ->setUpdatedAt($now)
                ->setIsActive(true)
                ->setDeletedAt(null);
        }

        $this->entityManager->flush();
        $output->writeln('<info>Données de démonstration créées ou mises à jour.</info>');
        $output->writeln(sprintf('Associations : %d | Salles : %d', count($associations), count($this->salleData())));
        $output->writeln('Mot de passe des comptes de test : Test123#');

        return Command::SUCCESS;
    }

    private function emailFor(string $firstName, string $lastName, string $association): string
    {
        $value = strtolower($firstName . '.' . $lastName . '.' . $association);
        $value = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value) ?: $value;
        $value = preg_replace('/[^a-z0-9]+/', '.', $value) ?? $value;

        return trim($value, '.') . '@demo.feytiat.fr';
    }

    /** @return list<array{name: string, contacts: list<array{firstName: string, lastName: string, phone: ?string}>}> */
    private function associationData(): array
    {
        $rows = [
            ['Amicale des donneurs de sang bénévoles', 'Antonio', 'Alves', '0612965167'],
            ['Association nationale des sous-officiers de réserve de l’Armée de l’air Limousin', 'André', 'Bellot', '0555483371'],
            ['AS Caporaux chefs parachutistes ACCP', 'Pascal', 'Hardy', '0677722620'],
            ['Coccinelle Foyer APF', 'Emilie', 'Granet', '0555002013'],
            ['FNACA', 'Michel', 'Villéger', '0555002717'],
            ['Léonarde Fayolle', '', 'Léonarde Fayolle', '0555483520'],
            ['Restaurants du Cœur', 'Catherine', 'Billoire', '0555798989'],
            ['Secours Populaire', 'Christiane', 'Doirat', '0555042000'],
            ['Ukraine Renaissance', 'Philippe', 'Henrat', '0677389403'],
            ['Vétérans OPEX-ONU-OTAN France', 'Jean-René', 'Duchêne', '0615423479'],
            ['Foyer Culturel Laïque (FCL)', 'Claudie', 'Croze', '0677612443'],
            ['Foyer Culturel Laïque (FCL)', 'André', 'Boden', '0689924102'],
            ['Boules club de Feytiat', 'Alain', 'Gerbaud', '0651951660'],
            ['CAMAF', 'Alain', 'Bouillon', '0687011316'],
            ['Club sportif de Feytiat', 'Gérard', 'Lathière', '0611172517'],
            ['Comité d’organisation de manifestations sportives', 'David', 'Pascaud', '0670903574'],
            ['Cyclo Club de Feytiat', 'Thomas', 'Duchossois', '0688213434'],
            ['Ducati do Lemouzi', 'Olivier', 'Ribette', '0787947183'],
            ['Ecole de bowling', 'Jean-Luc', 'Turlotte', '0777203908'],
            ['Feytiat basket', 'Stéphane', 'Serve', '0622623534'],
            ['Feytiat Gym et Danse', '', 'Feytiat Gym et Danse', '0555483981'],
            ['FUTSAL – Association sportive de Feytiat', 'Jérémie', 'Kulitza', null],
            ['Judo Club', 'Hélène', 'Galan', '0607880445'],
            ['Red Star Padel Tennis Club', 'Valérie', 'Geay', '0555771669'],
            ['Shoshin-Karaté-Do Shotokan Kase-Ha', 'M.', 'Benzenine', null],
            ['Tennis Club', 'Bastien', 'Roumegoux', null],
            ['Association philatélique limousine', 'Christian', 'Fabe', '0699512272'],
            ['ACCA', 'Christian', 'Reynaud', '0687799738'],
            ['Association des parents d’élèves (AFPE)', 'Damien', 'Tricard', '0765234278'],
            ['CAJAF', 'Philippe', 'Audonnet', '0636979696'],
            ['Comité des fêtes', 'Alain', 'Filloux', '0673121716'],
            ['Club du Mas Cerise', 'Christiane', 'Bourgeois', '0621829090'],
            ['Comice agricole cantonal des Biards', 'Gilles', 'Mousset', '0658439778'],
            ['Club de la figurine historique du Limousin et des amis du Maréchal Jourdan', 'Lydie', 'Queyroi', '0628807077'],
            ['Les Copains de Feytiat', 'Daniel', 'Batier', '0631955282'],
            ['OCEE', 'Thibault', 'Bergeron', '0555484323'],
            ['Vivre au Mas Gauthier', 'Michèle', 'Daubet', '0681144729'],
            ['Bout d’Ficelle', 'Corinne', 'Château', '0675913163'],
            ['Ciel de Musette', 'Alain', 'Faurel', '0603286113'],
            ['Comité de jumelage', 'Bernard', 'Mariaux', '0683332824'],
            ['Conservatoire aéronautique du Limousin', 'Pascal', 'Dugeay', '0680741879'],
            ['Félibrige', 'Nicole', 'Bayle', '0622043253'],
            ['La luette agile', 'Marc', 'Guiuerot', '0662726360'],
            ['Les Pastoureaux de la Valoine', 'Gilles', 'Deneken', '0681844885'],
            ['Les Baladines', 'Marcelle', 'Audrerie', '0555308422'],
            ['Mélosongs', 'Bruno', 'Leycuras', '0678850246'],
            ['Swing Music', 'Nicole', 'Lavauzelle Capelle', '0682084221'],
            ['AMAP', 'Corinne', 'Mineur', '0761147979'],
            ['Parc d’activités des Portes de Feytiat', 'Nicolas', 'Guillot', '0555451642'],
            ['Prévalescence', 'Sandra', 'Pailler', '0678083540'],
            ['Toutou’s Club 87', 'Sylvie', 'Mousnier', '0648826380'],
            ['Mobilité, sécurité, tranquillité à l’Est de Limoges', 'Valérie', 'Le Gallou', null],
        ];
        $result = [];
        foreach ($rows as $row) {
            $name = $row[0];
            $result[$name]['name'] = $name;
            $result[$name]['contacts'][] = [
                'firstName' => $row[1] ?: 'Contact',
                'lastName' => $row[2],
                'phone' => $row[3],
            ];
        }
        return array_values($result);
    }

    /** @return list<array{email: string, firstName: string, lastName: string, roles: list<string>}> */
    private function municipalUsers(): array
    {
        return [
            ['email' => 'admin@demo.feytiat.fr', 'firstName' => 'Admin', 'lastName' => 'Mairie', 'roles' => ['ROLE_ADMIN']],
            ['email' => 'evenements@demo.feytiat.fr', 'firstName' => 'Agent', 'lastName' => 'Événements', 'roles' => ['ROLE_GESTION_EVENT']],
            ['email' => 'subventions@demo.feytiat.fr', 'firstName' => 'Agent', 'lastName' => 'Subventions', 'roles' => ['ROLE_GESTION_SUBVENTION']],
            ['email' => 'materiel@demo.feytiat.fr', 'firstName' => 'Agent', 'lastName' => 'Matériel', 'roles' => ['ROLE_GESTION_MATERIEL']],
            ['email' => 'salles@demo.feytiat.fr', 'firstName' => 'Agent', 'lastName' => 'Salles', 'roles' => ['ROLE_GESTION_SALLE']],
            ['email' => 'coordination@demo.feytiat.fr', 'firstName' => 'Agent', 'lastName' => 'Coordination', 'roles' => ['ROLE_GESTION_EVENT', 'ROLE_GESTION_SALLE']],
        ];
    }

    /** @return list<array{name: string, description: string, capacity: int, pmr: bool, equipment: list<string>}> */
    private function salleData(): array
    {
        return [
            ['name' => 'Salle de spectacle', 'description' => 'Salle de spectacle municipale.', 'capacity' => 500, 'pmr' => true, 'equipment' => ['sonorisation', 'éclairage', 'scène']],
            ['name' => 'Salle Pastel', 'description' => 'Salle adaptée aux réunions et manifestations.', 'capacity' => 150, 'pmr' => true, 'equipment' => ['tables', 'chaises']],
            ['name' => 'Salle des Fêtes - Pierre Louis', 'description' => 'Salle des fêtes municipale.', 'capacity' => 300, 'pmr' => true, 'equipment' => ['tables', 'chaises', 'chauffage']],
            ['name' => 'Salle Croix des Rameaux', 'description' => 'Salle municipale polyvalente.', 'capacity' => 120, 'pmr' => true, 'equipment' => ['tables', 'chaises']],
            ['name' => 'Salle André Périgord', 'description' => 'Salle municipale polyvalente.', 'capacity' => 120, 'pmr' => true, 'equipment' => ['tables', 'chaises']],
            ['name' => 'Gymnase Kach Cazalon', 'description' => 'Gymnase municipal.', 'capacity' => 250, 'pmr' => true, 'equipment' => ['vestiaires', 'douches']],
            ['name' => 'Gymnase Roger Couderc', 'description' => 'Gymnase municipal.', 'capacity' => 250, 'pmr' => true, 'equipment' => ['vestiaires', 'douches']],
            ['name' => 'Salle de gymnastique Emilie Lepennec', 'description' => 'Salle dédiée aux activités de gymnastique.', 'capacity' => 100, 'pmr' => true, 'equipment' => ['tapis', 'miroirs']],
            ['name' => 'Salle de convivialité Roger Couderc', 'description' => 'Salle de convivialité.', 'capacity' => 80, 'pmr' => true, 'equipment' => ['tables', 'chaises']],
            ['name' => 'Appartement communal', 'description' => 'Appartement communal disponible à la réservation.', 'capacity' => 6, 'pmr' => false, 'equipment' => ['cuisine']],
            ['name' => 'Halle des étangs de Crouzeix', 'description' => 'Réservée aux entreprises de Feytiat.', 'capacity' => 200, 'pmr' => true, 'equipment' => ['électricité']],
        ];
    }
}
