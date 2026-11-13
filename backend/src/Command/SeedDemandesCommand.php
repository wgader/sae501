<?php

namespace App\Command;

use App\Entity\Association;
use App\Entity\DemandeStatusHistory;
use App\Entity\DemandeSubvention;
use App\Entity\DocumentJustificatif;
use App\Entity\Materiel;
use App\Entity\ReservationMateriel;
use App\Entity\ReservationMaterielLigne;
use App\Entity\ReservationSalle;
use App\Entity\Salle;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:seed-demandes',
    description: 'Peuple la base de données avec un historique complet de démarches réalistes pour les tests'
)]
class SeedDemandesCommand extends Command
{
    public function __construct(
        private readonly EntityManagerInterface $em
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('association-id', null, InputOption::VALUE_OPTIONAL, "ID de l'association cible (défaut: 15 ou première association validée)")
            ->addOption('clean', null, InputOption::VALUE_NONE, 'Supprimer les démarches existantes avant d\'insérer');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $assoRepo = $this->em->getRepository(Association::class);
        $assoId = $input->getOption('association-id');

        /** @var Association|null $association */
        $association = null;
        if ($assoId !== null) {
            $association = $assoRepo->find((int) $assoId);
        }

        if ($association === null) {
            $association = $assoRepo->findOneBy(['nom' => 'Feytiat Culture']) ?? $assoRepo->findOneBy([]) ;
        }

        if ($association === null) {
            $io->error("Aucune association trouvée en base. Veuillez d'abord inscrire une association.");
            return Command::FAILURE;
        }

        $io->title(sprintf("Génération de démarches de test pour l'association : %s (ID %d)", $association->getNom(), $association->getId()));

        if ($input->getOption('clean')) {
            $io->section("Nettoyage des démarches existantes...");
            $this->cleanExistingRequests($association);
        }

        // 1. Salles
        $salles = $this->ensureSalles();

        // 2. Matériels
        $materiels = $this->ensureMateriels();

        // 3. Subventions
        $io->section("Création des demandes de subvention...");
        $this->seedSubventions($association);

        // 4. Réservations Matériel
        $io->section("Création des réservations de matériel...");
        $this->seedMaterielReservations($association, $materiels);

        // 5. Réservations Salle
        $io->section("Création des réservations de salle...");
        $this->seedSalleReservations($association, $salles);

        $this->em->flush();

        $io->success("Toutes les démarches de test ont été générées avec succès ! Vous pouvez maintenant vérifier l'historique sur l'espace usager.");

        return Command::SUCCESS;
    }

    /**
     * @return array<string, Salle>
     */
    private function ensureSalles(): array
    {
        $salleRepo = $this->em->getRepository(Salle::class);
        $result = [];

        $salle1 = $salleRepo->findOneBy(['nom' => 'Salle Municipale']);
        if ($salle1 === null) {
            $salle1 = new Salle();
            $salle1->setNom('Salle Municipale');
            $salle1->setAdresse('Place de la Mairie, 87220 Feytiat');
            $salle1->setCapaciteMax(120);
            $salle1->setAccesPmr(true);
            $salle1->setEquipementsInclus(['Tables', 'Chaises', 'Micro', 'Scène']);
            $salle1->setIsActive(true);
            $this->em->persist($salle1);
        }
        $result['municipale'] = $salle1;

        $salle2 = $salleRepo->findOneBy(['nom' => 'Espace Georges Brassens']);
        if ($salle2 === null) {
            $salle2 = new Salle();
            $salle2->setNom('Espace Georges Brassens');
            $salle2->setAdresse('Avenue des Sports, 87220 Feytiat');
            $salle2->setCapaciteMax(250);
            $salle2->setAccesPmr(true);
            $salle2->setEquipementsInclus(['Sonorisation intégrée', 'Éclairage scénique', 'Office traiteur', 'Vidéoprojecteur']);
            $salle2->setIsActive(true);
            $this->em->persist($salle2);
        }
        $result['brassens'] = $salle2;

        return $result;
    }

    /**
     * @return array<string, Materiel>
     */
    private function ensureMateriels(): array
    {
        $matRepo = $this->em->getRepository(Materiel::class);
        $result = [];

        $chaise = $matRepo->findOneBy(['designation' => 'Chaise']) ?? $matRepo->findOneBy(['designation' => 'Chaise pliante']);
        if ($chaise === null) {
            $chaise = new Materiel();
            $chaise->setDesignation('Chaise pliante');
            $chaise->setCategorie('Mobilier');
            $chaise->setStockTotal(200);
            $this->em->persist($chaise);
        }
        $result['chaise'] = $chaise;

        $table = $matRepo->findOneBy(['designation' => 'Table pliante (6 pers.)']);
        if ($table === null) {
            $table = new Materiel();
            $table->setDesignation('Table pliante (6 pers.)');
            $table->setCategorie('Mobilier');
            $table->setStockTotal(50);
            $this->em->persist($table);
        }
        $result['table'] = $table;

        $sono = $matRepo->findOneBy(['designation' => 'Système sonorisation portable']);
        if ($sono === null) {
            $sono = new Materiel();
            $sono->setDesignation('Système sonorisation portable');
            $sono->setCategorie('Audiovisuel');
            $sono->setStockTotal(5);
            $this->em->persist($sono);
        }
        $result['sono'] = $sono;

        $video = $matRepo->findOneBy(['designation' => 'Vidéoprojecteur HD + Écran']);
        if ($video === null) {
            $video = new Materiel();
            $video->setDesignation('Vidéoprojecteur HD + Écran');
            $video->setCategorie('Audiovisuel');
            $video->setStockTotal(8);
            $this->em->persist($video);
        }
        $result['video'] = $video;

        return $result;
    }

    private function seedSubventions(Association $association): void
    {
        // 1. Festival 2026 - En cours
        $sub1 = new DemandeSubvention();
        $sub1->setAssociation($association);
        $sub1->setIntituleProjet('Organisation du Festival Culturel de Printemps 2026');
        $sub1->setTypeSubvention('Projet');
        $sub1->setDescription("Financement des artistes, de la régie technique et de la communication de la 5ème édition du Festival de Printemps de Feytiat.");
        $sub1->setMontantDemande('3500.00');
        $sub1->setAnneeExercice(2026);
        $sub1->setStatut('En cours de traitement');
        $sub1->setObservations('Dossier complet transmis en commission culture pour délibération de mai 2026.');
        $this->em->persist($sub1);
        $this->em->flush();

        $this->addTimeline('subvention', (int) $sub1->getId(), 'En attente', 'Dépôt de la demande', 'Dossier de demande de subvention déposé en ligne par l\'association.', $association->getNom(), new \DateTimeImmutable('2026-03-01 10:30:00'));
        $this->addTimeline('subvention', (int) $sub1->getId(), 'En cours de traitement', 'Prise en charge par le service Vie Associative', 'Dossier jugé recevable, passage programmé en commission municipale.', 'Mairie de Feytiat (Service Culture)', new \DateTimeImmutable('2026-03-05 14:15:00'));

        $this->addDocument($association, 'subvention', (int) $sub1->getId(), 'Budget prévisionnel équilibré', '/uploads/documents/budget_festival_2026.pdf', 'Budget détaillé prévisionnel du festival');
        $this->addDocument($association, 'subvention', (int) $sub1->getId(), 'Devis régie son et lumières', '/uploads/documents/devis_regie_2026.pdf', 'Devis prestataire technique');

        // 2. Subvention Fonctionnement 2025 - Validée
        $sub2 = new DemandeSubvention();
        $sub2->setAssociation($association);
        $sub2->setIntituleProjet('Subvention de fonctionnement annuelle 2025');
        $sub2->setTypeSubvention('Fonctionnement');
        $sub2->setDescription("Aide au fonctionnement récurrent : assurances, adhésions fédérales et fournitures pédagogiques.");
        $sub2->setMontantDemande('2000.00');
        $sub2->setMontantAccorde('1800.00');
        $sub2->setAnneeExercice(2025);
        $sub2->setStatut('Validée');
        $sub2->setObservations('Subvention validée par le Conseil Municipal le 14/04/2025 pour un montant de 1 800,00 €. Versement effectué le 02/05/2025.');
        $this->em->persist($sub2);
        $this->em->flush();

        $this->addTimeline('subvention', (int) $sub2->getId(), 'En attente', 'Dépôt du dossier annuel', 'Dossier annuel de subvention de fonctionnement.', $association->getNom(), new \DateTimeImmutable('2025-01-15 09:00:00'));
        $this->addTimeline('subvention', (int) $sub2->getId(), 'En cours de traitement', 'Instruction financière', 'Analyse du bilan comptable N-1 par les services financiers.', 'Mairie de Feytiat (Finances)', new \DateTimeImmutable('2025-02-10 11:00:00'));
        $this->addTimeline('subvention', (int) $sub2->getId(), 'Validée', 'Vote du Conseil Municipal', 'Délibération favorable n°2025-42 : 1 800 € alloués.', 'Conseil Municipal', new \DateTimeImmutable('2025-04-14 20:30:00'));

        $this->addDocument($association, 'subvention', (int) $sub2->getId(), 'Délibération du Conseil Municipal', '/uploads/documents/deliberation_subvention_2025.pdf', 'Extrait du registre des délibérations');

        // 3. Subvention Théâtre 2024 - Refusée
        $sub3 = new DemandeSubvention();
        $sub3->setAssociation($association);
        $sub3->setIntituleProjet('Achat d\'équipements pour ateliers de théâtre jeunesse');
        $sub3->setTypeSubvention('Investissement');
        $sub3->setDescription("Acquisition de costumes et décors modulaires pour les ateliers de pratique théâtrale.");
        $sub3->setMontantDemande('4200.00');
        $sub3->setAnneeExercice(2024);
        $sub3->setStatut('Refusée');
        $sub3->setObservations('Enveloppe d\'investissement communal épuisée sur l\'exercice 2024. Vous êtes invités à reformuler votre demande au titre de l\'exercice suivant.');
        $this->em->persist($sub3);
        $this->em->flush();

        $this->addTimeline('subvention', (int) $sub3->getId(), 'En attente', 'Dépôt du dossier', 'Demande de subvention exceptionnelle d\'investissement.', $association->getNom(), new \DateTimeImmutable('2024-05-10 16:00:00'));
        $this->addTimeline('subvention', (int) $sub3->getId(), 'Refusée', 'Décision de non-attribution', 'Refus notifié suite aux arbitrages budgétaires.', 'Mairie de Feytiat (Adjoint aux Finances)', new \DateTimeImmutable('2024-06-25 15:45:00'));

        // 4. Subvention Résidences d'artistes 2026 - Complément requis
        $sub4 = new DemandeSubvention();
        $sub4->setAssociation($association);
        $sub4->setIntituleProjet('Résidences d\'artistes et médiation culturelle');
        $sub4->setTypeSubvention('Projet');
        $sub4->setDescription("Accueil de trois artistes en résidence et ateliers ouverts aux écoles de la commune.");
        $sub4->setMontantDemande('2800.00');
        $sub4->setAnneeExercice(2026);
        $sub4->setStatut('Complément requis');
        $sub4->setObservations('Veuillez fournir les conventions d\'engagement des artistes prévus ainsi que le calendrier précis des interventions en milieu scolaire.');
        $this->em->persist($sub4);
        $this->em->flush();

        $this->addTimeline('subvention', (int) $sub4->getId(), 'En attente', 'Dossier initial déposé', 'Dépôt de la demande pour les résidences d\'artistes.', $association->getNom(), new \DateTimeImmutable('2026-02-12 11:20:00'));
        $this->addTimeline('subvention', (int) $sub4->getId(), 'Complément requis', 'Pièces justificatives manquantes', 'Précisions nécessaires sur le planning scolaire et les conventions.', 'Mairie de Feytiat (Service Culture)', new \DateTimeImmutable('2026-02-28 17:00:00'));
    }

    /**
     * @param array<string, Materiel> $materiels
     */
    private function seedMaterielReservations(Association $association, array $materiels): void
    {
        // 1. Réservation pour la Fête associative de l'été 2026 - Complément requis
        $mat1 = new ReservationMateriel();
        $mat1->setAssociation($association);
        $mat1->setMotifEvenement('Fête associative et gala annuel de musique');
        $mat1->setDateRetrait(new \DateTimeImmutable('2026-06-19 14:00:00'));
        $mat1->setDateRestitution(new \DateTimeImmutable('2026-06-21 18:00:00'));
        $mat1->setStatut('Complément requis');
        $mat1->setCautionMontant('250.00');
        $mat1->setObservations('Merci de nous téléverser votre attestation d\'assurance Responsabilité Civile couvrant l\'emprunt de matériel communal pour l\'année 2026.');
        $this->em->persist($mat1);

        $ligne1 = new ReservationMaterielLigne();
        $ligne1->setReservationMateriel($mat1);
        $ligne1->setMateriel($materiels['chaise']);
        $ligne1->setQuantite(40);
        $this->em->persist($ligne1);

        $ligne2 = new ReservationMaterielLigne();
        $ligne2->setReservationMateriel($mat1);
        $ligne2->setMateriel($materiels['table']);
        $ligne2->setQuantite(8);
        $this->em->persist($ligne2);

        $this->em->flush();

        $this->addTimeline('materiel', (int) $mat1->getId(), 'En attente', 'Demande de réservation saisie', 'Réservation de 40 chaises et 8 tables.', $association->getNom(), new \DateTimeImmutable('2026-04-02 14:00:00'));
        $this->addTimeline('materiel', (int) $mat1->getId(), 'Complément requis', 'Attestation d\'assurance demandée', 'L\'attestation enregistrée est expirée.', 'Services Techniques Municipaux', new \DateTimeImmutable('2026-04-05 10:15:00'));

        // 2. Concert de rentrée - Validée
        $mat2 = new ReservationMateriel();
        $mat2->setAssociation($association);
        $mat2->setMotifEvenement('Concert acoustique sous chapiteau');
        $mat2->setDateRetrait(new \DateTimeImmutable('2026-09-18 10:00:00'));
        $mat2->setDateRestitution(new \DateTimeImmutable('2026-09-20 12:00:00'));
        $mat2->setStatut('Validée');
        $mat2->setCautionMontant('300.00');
        $mat2->setCautionPayeeAt(new \DateTimeImmutable('2026-04-10 11:00:00'));
        $mat2->setObservations('Réservation confirmée. Le matériel sera à retirer aux ateliers municipaux le vendredi 18/09 entre 10h et 12h.');
        $this->em->persist($mat2);

        $ligneSono = new ReservationMaterielLigne();
        $ligneSono->setReservationMateriel($mat2);
        $ligneSono->setMateriel($materiels['sono']);
        $ligneSono->setQuantite(1);
        $this->em->persist($ligneSono);

        $ligneProj = new ReservationMaterielLigne();
        $ligneProj->setReservationMateriel($mat2);
        $ligneProj->setMateriel($materiels['video']);
        $ligneProj->setQuantite(1);
        $this->em->persist($ligneProj);

        $this->em->flush();

        $this->addTimeline('materiel', (int) $mat2->getId(), 'En attente', 'Demande déposée', 'Demande pour équipement sonorisation et projection.', $association->getNom(), new \DateTimeImmutable('2026-03-20 09:30:00'));
        $this->addTimeline('materiel', (int) $mat2->getId(), 'En cours de traitement', 'Vérification disponibilité parc matériel', 'Matériel disponible pour la période sollicitée.', 'Services Techniques', new \DateTimeImmutable('2026-03-22 15:00:00'));
        $this->addTimeline('materiel', (int) $mat2->getId(), 'Validée', 'Réservation validée et caution enregistrée', 'Chèque de caution de 300 € reçu en mairie.', 'Régie Municipale', new \DateTimeImmutable('2026-04-10 11:00:00'));

        $this->addDocument($association, 'materiel', (int) $mat2->getId(), 'Bon d\'emprunt de matériel validé', '/uploads/documents/bon_materiel_concert2026.pdf', 'Fiche d\'inventaire et bon de retrait');

        // 3. Exposition d'hiver 2026 - Matériel restitué
        $mat3 = new ReservationMateriel();
        $mat3->setAssociation($association);
        $mat3->setMotifEvenement('Exposition photographique communale');
        $mat3->setDateRetrait(new \DateTimeImmutable('2026-01-09 14:00:00'));
        $mat3->setDateRestitution(new \DateTimeImmutable('2026-01-12 17:00:00'));
        $mat3->setStatut('Matériel restitué');
        $mat3->setCautionMontant('150.00');
        $mat3->setCautionPayeeAt(new \DateTimeImmutable('2026-01-08 16:00:00'));
        $mat3->setMaterielRetireAt(new \DateTimeImmutable('2026-01-09 14:30:00'));
        $mat3->setMaterielRestitueAt(new \DateTimeImmutable('2026-01-12 16:45:00'));
        $mat3->setCautionRendueAt(new \DateTimeImmutable('2026-01-13 10:00:00'));
        $mat3->setObservations('Matériel restitué en parfait état de propreté et de fonctionnement. Caution de 150 € restituée au trésorier de l\'association.');
        $this->em->persist($mat3);

        $ligneTablePasse = new ReservationMaterielLigne();
        $ligneTablePasse->setReservationMateriel($mat3);
        $ligneTablePasse->setMateriel($materiels['table']);
        $ligneTablePasse->setQuantite(10);
        $this->em->persist($ligneTablePasse);

        $this->em->flush();

        $this->addTimeline('materiel', (int) $mat3->getId(), 'En attente', 'Demande initiale', 'Emprunt de 10 tables pour exposition.', $association->getNom(), new \DateTimeImmutable('2025-12-15 10:00:00'));
        $this->addTimeline('materiel', (int) $mat3->getId(), 'Validée', 'Validation logistique', 'Disponibilité confirmée.', 'Services Techniques', new \DateTimeImmutable('2025-12-18 11:30:00'));
        $this->addTimeline('materiel', (int) $mat3->getId(), 'Validée', 'Matériel retiré', '10 tables retirées par l\'association. Caution remise.', 'Services Techniques', new \DateTimeImmutable('2026-01-09 14:30:00'));
        $this->addTimeline('materiel', (int) $mat3->getId(), 'Matériel restitué', 'Matériel restitué conforme', 'Inventaire de retour OK. Caution restituée.', 'Services Techniques', new \DateTimeImmutable('2026-01-12 16:45:00'));
    }

    /**
     * @param array<string, Salle> $salles
     */
    private function seedSalleReservations(Association $association, array $salles): void
    {
        // 1. Assemblée Générale - Espace Georges Brassens - Validée
        $sal1 = new ReservationSalle();
        $sal1->setAssociation($association);
        $sal1->setSalle($salles['brassens']);
        $sal1->setMotifEvenement('Assemblée Générale Ordinaire et conférence annuelle');
        $sal1->setDateDebut(new \DateTimeImmutable('2026-05-22 17:30:00'));
        $sal1->setDateFin(new \DateTimeImmutable('2026-05-22 23:30:00'));
        $sal1->setCapaciteAttendue(110);
        $sal1->setStatut('Validée');
        $sal1->setObservations('Mise à disposition des clés à 17h00. Fermeture impérative de la salle à minuit après extinction des lumières et vérification des issues de secours.');
        $this->em->persist($sal1);
        $this->em->flush();

        $this->addTimeline('salle', (int) $sal1->getId(), 'En attente', 'Dépôt de la réservation de salle', 'Créneau demandé : 22 mai 2026.', $association->getNom(), new \DateTimeImmutable('2026-03-10 11:00:00'));
        $this->addTimeline('salle', (int) $sal1->getId(), 'En cours de traitement', 'Examen du planning municipal', 'Vérification de la compatibilité avec les activités scolaires.', 'Service Gestion des Salles', new \DateTimeImmutable('2026-03-12 14:00:00'));
        $this->addTimeline('salle', (int) $sal1->getId(), 'Validée', 'Réservation approuvée', 'Arrêté d\'occupation établi et validé.', 'Cabinet du Maire', new \DateTimeImmutable('2026-03-15 09:45:00'));

        $this->addDocument($association, 'salle', (int) $sal1->getId(), 'Arrêté municipal d\'occupation temporaire', '/uploads/documents/arrete_occupation_ag2026.pdf', 'Arrêté du Maire portant autorisation d\'occupation de la salle');

        // 2. Stage Théâtre - Salle Municipale - En cours de traitement
        $sal2 = new ReservationSalle();
        $sal2->setAssociation($association);
        $sal2->setSalle($salles['municipale']);
        $sal2->setMotifEvenement('Stage intensif de théâtre et expression corporelle');
        $sal2->setDateDebut(new \DateTimeImmutable('2026-10-24 09:00:00'));
        $sal2->setDateFin(new \DateTimeImmutable('2026-10-25 18:00:00'));
        $sal2->setCapaciteAttendue(35);
        $sal2->setStatut('En cours de traitement');
        $sal2->setObservations('Vérification en cours avec le club d\'escrime qui utilise habituellement la salle le samedi matin.');
        $this->em->persist($sal2);
        $this->em->flush();

        $this->addTimeline('salle', (int) $sal2->getId(), 'En attente', 'Demande enregistrée', 'Réservation pour le week-end du 24-25 octobre 2026.', $association->getNom(), new \DateTimeImmutable('2026-04-18 15:30:00'));
        $this->addTimeline('salle', (int) $sal2->getId(), 'En cours de traitement', 'Arbitrage de planning', 'Prise de contact avec les utilisateurs récurrents pour libération du créneau.', 'Service des Sports et de la Vie Associative', new \DateTimeImmutable('2026-04-22 10:00:00'));

        // 3. Fête de Réveillon 2025 - Refusée
        $sal3 = new ReservationSalle();
        $sal3->setAssociation($association);
        $sal3->setSalle($salles['brassens']);
        $sal3->setMotifEvenement('Soirée dansante et réveillon du Nouvel An');
        $sal3->setDateDebut(new \DateTimeImmutable('2025-12-31 20:00:00'));
        $sal3->setDateFin(new \DateTimeImmutable('2026-01-01 04:00:00'));
        $sal3->setCapaciteAttendue(180);
        $sal3->setStatut('Refusée');
        $sal3->setObservations('L\'Espace Georges Brassens n\'est pas ouvert aux locations associatives pendant les congés de fin d\'année en raison de travaux de maintenance des installations thermiques.');
        $this->em->persist($sal3);
        $this->em->flush();

        $this->addTimeline('salle', (int) $sal3->getId(), 'En attente', 'Demande soumise', 'Demande pour la nuitée de la Saint-Sylvestre.', $association->getNom(), new \DateTimeImmutable('2025-09-01 10:00:00'));
        $this->addTimeline('salle', (int) $sal3->getId(), 'Refusée', 'Refus motivé', 'Période de fermeture technique annuelle communale.', 'Mairie de Feytiat', new \DateTimeImmutable('2025-09-15 16:30:00'));
    }

    private function addTimeline(
        string $demandeType,
        int $demandeId,
        string $statut,
        string $label,
        string $commentaire,
        string $auteur,
        \DateTimeImmutable $createdAt
    ): void {
        $history = new DemandeStatusHistory(
            $demandeType,
            $demandeId,
            $statut,
            $label,
            $commentaire,
            $auteur,
            $createdAt
        );
        $this->em->persist($history);
    }

    private function addDocument(
        Association $association,
        string $type,
        int $id,
        string $titre,
        string $url,
        string $description
    ): void {
        $doc = new DocumentJustificatif();
        $doc->setAssociation($association);
        $doc->setTypeDocument($titre);
        $doc->setFichierUrl($url);
        $doc->setDescription($description);
        $doc->setLieAType($type);
        $doc->setLieAId($id);
        $this->em->persist($doc);
    }

    private function cleanExistingRequests(Association $association): void
    {
        // Supprime les documents liés
        $this->em->createQuery('DELETE FROM App\Entity\DocumentJustificatif d WHERE d.association = :asso')
            ->setParameter('asso', $association)
            ->execute();

        // Supprime l'historique
        $this->em->createQuery('DELETE FROM App\Entity\DemandeStatusHistory h')->execute();

        // Supprime les lignes de réservation matériel
        $this->em->createQuery('DELETE FROM App\Entity\ReservationMaterielLigne l')->execute();

        // Supprime les réservations matériel
        $this->em->createQuery('DELETE FROM App\Entity\ReservationMateriel m WHERE m.association = :asso')
            ->setParameter('asso', $association)
            ->execute();

        // Supprime les réservations de salle
        $this->em->createQuery('DELETE FROM App\Entity\ReservationSalle s WHERE s.association = :asso')
            ->setParameter('asso', $association)
            ->execute();

        // Supprime les subventions
        $this->em->createQuery('DELETE FROM App\Entity\DemandeSubvention sub WHERE sub.association = :asso')
            ->setParameter('asso', $association)
            ->execute();
    }
}

