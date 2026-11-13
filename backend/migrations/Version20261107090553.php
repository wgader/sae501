<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261107090553 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE association (id INT AUTO_INCREMENT NOT NULL, nom VARCHAR(255) NOT NULL, nombre_membres INT DEFAULT NULL, statut VARCHAR(30) NOT NULL, module_subvention_actif TINYINT DEFAULT 1 NOT NULL, module_materiel_actif TINYINT DEFAULT 1 NOT NULL, module_salle_actif TINYINT DEFAULT 1 NOT NULL, created_at DATETIME NOT NULL, valide_at DATETIME DEFAULT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE demande_status_history (id INT AUTO_INCREMENT NOT NULL, demande_type VARCHAR(30) NOT NULL, demande_id INT NOT NULL, statut VARCHAR(50) NOT NULL, label VARCHAR(255) NOT NULL, commentaire LONGTEXT DEFAULT NULL, auteur VARCHAR(100) DEFAULT NULL, created_at DATETIME NOT NULL, INDEX idx_demande_lookup (demande_type, demande_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE demande_subvention (id INT AUTO_INCREMENT NOT NULL, intitule_projet VARCHAR(255) NOT NULL, type_subvention VARCHAR(50) NOT NULL, description LONGTEXT DEFAULT NULL, montant_demande NUMERIC(10, 2) NOT NULL, montant_accorde NUMERIC(10, 2) DEFAULT NULL, annee_exercice INT NOT NULL, statut VARCHAR(50) NOT NULL, observations LONGTEXT DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, association_id INT NOT NULL, INDEX IDX_3A753397EFB9C8A5 (association_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE document_justificatif (id INT AUTO_INCREMENT NOT NULL, type_document VARCHAR(100) NOT NULL, fichier_url VARCHAR(500) NOT NULL, description LONGTEXT DEFAULT NULL, lie_atype VARCHAR(50) DEFAULT NULL, lie_aid INT DEFAULT NULL, created_at DATETIME NOT NULL, deleted_at DATETIME DEFAULT NULL, association_id INT NOT NULL, INDEX IDX_3D36E4ADEFB9C8A5 (association_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE external_event (id INT AUTO_INCREMENT NOT NULL, asso_id INT NOT NULL, title VARCHAR(255) NOT NULL, location VARCHAR(255) NOT NULL, event_type VARCHAR(255) NOT NULL, start_date DATETIME NOT NULL, end_time DATETIME NOT NULL, status VARCHAR(255) NOT NULL, created_at DATETIME NOT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE external_event_file (id INT AUTO_INCREMENT NOT NULL, event_id INT NOT NULL, file_path VARCHAR(255) NOT NULL, file_type VARCHAR(255) NOT NULL, original_name VARCHAR(255) NOT NULL, mime_type VARCHAR(100) NOT NULL, file_size INT NOT NULL, sha256 VARCHAR(64) NOT NULL, created_at DATETIME NOT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE materiel (id INT AUTO_INCREMENT NOT NULL, designation VARCHAR(255) NOT NULL, categorie VARCHAR(100) NOT NULL, reference_interne VARCHAR(50) DEFAULT NULL, description LONGTEXT DEFAULT NULL, consignes_utilisation LONGTEXT DEFAULT NULL, stock_total INT NOT NULL, is_archived TINYINT DEFAULT 0 NOT NULL, image_path VARCHAR(255) DEFAULT NULL, created_at DATETIME NOT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE notification (id INT AUTO_INCREMENT NOT NULL, title VARCHAR(255) NOT NULL, message LONGTEXT NOT NULL, type VARCHAR(50) NOT NULL, event_id INT DEFAULT NULL, read_at DATETIME DEFAULT NULL, created_at DATETIME NOT NULL, user_id INT NOT NULL, INDEX idx_notification_user_read (user_id, read_at), INDEX IDX_BF5476CAA76ED395 (user_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE reservation_materiel (id INT AUTO_INCREMENT NOT NULL, motif_evenement VARCHAR(255) NOT NULL, date_retrait DATETIME NOT NULL, date_restitution DATETIME NOT NULL, statut VARCHAR(50) NOT NULL, caution_montant NUMERIC(10, 2) DEFAULT NULL, caution_payee_at DATETIME DEFAULT NULL, materiel_retire_at DATETIME DEFAULT NULL, materiel_restitue_at DATETIME DEFAULT NULL, caution_rendue_at DATETIME DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, note_interne LONGTEXT DEFAULT NULL, observations LONGTEXT DEFAULT NULL, association_id INT NOT NULL, INDEX IDX_85675285EFB9C8A5 (association_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE reservation_materiel_ligne (id INT AUTO_INCREMENT NOT NULL, quantite INT NOT NULL, reservation_materiel_id INT NOT NULL, materiel_id INT NOT NULL, INDEX IDX_9069380EDAE4D7F3 (reservation_materiel_id), INDEX IDX_9069380E16880AAF (materiel_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE reservation_salle (id INT AUTO_INCREMENT NOT NULL, motif_evenement VARCHAR(255) NOT NULL, date_debut DATETIME NOT NULL, date_fin DATETIME NOT NULL, capacite_attendue INT DEFAULT NULL, statut VARCHAR(50) NOT NULL, observations LONGTEXT DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, association_id INT NOT NULL, salle_id INT NOT NULL, INDEX IDX_DE8AEFBEFB9C8A5 (association_id), INDEX IDX_DE8AEFBDC304035 (salle_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE salle (id INT AUTO_INCREMENT NOT NULL, nom VARCHAR(255) NOT NULL, description LONGTEXT DEFAULT NULL, image_path VARCHAR(255) DEFAULT NULL, adresse VARCHAR(255) NOT NULL, capacite_max INT NOT NULL, acces_pmr TINYINT NOT NULL, equipements_inclus JSON NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, is_active TINYINT NOT NULL, deleted_at DATETIME DEFAULT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE stock_adjustment (id INT AUTO_INCREMENT NOT NULL, previous_stock INT NOT NULL, new_stock INT NOT NULL, reason VARCHAR(100) NOT NULL, created_at DATETIME NOT NULL, materiel_id INT NOT NULL, agent_id INT NOT NULL, INDEX IDX_27B08FBA16880AAF (materiel_id), INDEX IDX_27B08FBA3414710B (agent_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE `user` (id INT AUTO_INCREMENT NOT NULL, email VARCHAR(180) NOT NULL, roles JSON NOT NULL, password VARCHAR(255) DEFAULT NULL, nom VARCHAR(100) NOT NULL, prenom VARCHAR(100) NOT NULL, telephone VARCHAR(20) DEFAULT NULL, type_compte VARCHAR(20) NOT NULL, is_verified TINYINT NOT NULL, created_at DATETIME NOT NULL, cgu_validate_at DATETIME DEFAULT NULL, activation_token VARCHAR(100) DEFAULT NULL, activation_token_expires_at DATETIME DEFAULT NULL, inactivated_at DATETIME DEFAULT NULL, deleted_at DATETIME DEFAULT NULL, association_id INT DEFAULT NULL, UNIQUE INDEX UNIQ_IDENTIFIER_EMAIL (email), INDEX IDX_8D93D649EFB9C8A5 (association_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE messenger_messages (id BIGINT AUTO_INCREMENT NOT NULL, body LONGTEXT NOT NULL, headers LONGTEXT NOT NULL, queue_name VARCHAR(190) NOT NULL, created_at DATETIME NOT NULL, available_at DATETIME NOT NULL, delivered_at DATETIME DEFAULT NULL, INDEX IDX_75EA56E0FB7336F0E3BD61CE16BA31DBBF396750 (queue_name, available_at, delivered_at, id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE demande_subvention ADD CONSTRAINT FK_3A753397EFB9C8A5 FOREIGN KEY (association_id) REFERENCES association (id)');
        $this->addSql('ALTER TABLE document_justificatif ADD CONSTRAINT FK_3D36E4ADEFB9C8A5 FOREIGN KEY (association_id) REFERENCES association (id)');
        $this->addSql('ALTER TABLE notification ADD CONSTRAINT FK_BF5476CAA76ED395 FOREIGN KEY (user_id) REFERENCES `user` (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE reservation_materiel ADD CONSTRAINT FK_85675285EFB9C8A5 FOREIGN KEY (association_id) REFERENCES association (id)');
        $this->addSql('ALTER TABLE reservation_materiel_ligne ADD CONSTRAINT FK_9069380EDAE4D7F3 FOREIGN KEY (reservation_materiel_id) REFERENCES reservation_materiel (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE reservation_materiel_ligne ADD CONSTRAINT FK_9069380E16880AAF FOREIGN KEY (materiel_id) REFERENCES materiel (id) ON DELETE RESTRICT');
        $this->addSql('ALTER TABLE reservation_salle ADD CONSTRAINT FK_DE8AEFBEFB9C8A5 FOREIGN KEY (association_id) REFERENCES association (id)');
        $this->addSql('ALTER TABLE reservation_salle ADD CONSTRAINT FK_DE8AEFBDC304035 FOREIGN KEY (salle_id) REFERENCES salle (id)');
        $this->addSql('ALTER TABLE stock_adjustment ADD CONSTRAINT FK_27B08FBA16880AAF FOREIGN KEY (materiel_id) REFERENCES materiel (id) ON DELETE RESTRICT');
        $this->addSql('ALTER TABLE stock_adjustment ADD CONSTRAINT FK_27B08FBA3414710B FOREIGN KEY (agent_id) REFERENCES `user` (id) ON DELETE RESTRICT');
        $this->addSql('ALTER TABLE `user` ADD CONSTRAINT FK_8D93D649EFB9C8A5 FOREIGN KEY (association_id) REFERENCES association (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE demande_subvention DROP FOREIGN KEY FK_3A753397EFB9C8A5');
        $this->addSql('ALTER TABLE document_justificatif DROP FOREIGN KEY FK_3D36E4ADEFB9C8A5');
        $this->addSql('ALTER TABLE notification DROP FOREIGN KEY FK_BF5476CAA76ED395');
        $this->addSql('ALTER TABLE reservation_materiel DROP FOREIGN KEY FK_85675285EFB9C8A5');
        $this->addSql('ALTER TABLE reservation_materiel_ligne DROP FOREIGN KEY FK_9069380EDAE4D7F3');
        $this->addSql('ALTER TABLE reservation_materiel_ligne DROP FOREIGN KEY FK_9069380E16880AAF');
        $this->addSql('ALTER TABLE reservation_salle DROP FOREIGN KEY FK_DE8AEFBEFB9C8A5');
        $this->addSql('ALTER TABLE reservation_salle DROP FOREIGN KEY FK_DE8AEFBDC304035');
        $this->addSql('ALTER TABLE stock_adjustment DROP FOREIGN KEY FK_27B08FBA16880AAF');
        $this->addSql('ALTER TABLE stock_adjustment DROP FOREIGN KEY FK_27B08FBA3414710B');
        $this->addSql('ALTER TABLE `user` DROP FOREIGN KEY FK_8D93D649EFB9C8A5');
        $this->addSql('DROP TABLE association');
        $this->addSql('DROP TABLE demande_status_history');
        $this->addSql('DROP TABLE demande_subvention');
        $this->addSql('DROP TABLE document_justificatif');
        $this->addSql('DROP TABLE external_event');
        $this->addSql('DROP TABLE external_event_file');
        $this->addSql('DROP TABLE materiel');
        $this->addSql('DROP TABLE notification');
        $this->addSql('DROP TABLE reservation_materiel');
        $this->addSql('DROP TABLE reservation_materiel_ligne');
        $this->addSql('DROP TABLE reservation_salle');
        $this->addSql('DROP TABLE salle');
        $this->addSql('DROP TABLE stock_adjustment');
        $this->addSql('DROP TABLE `user`');
        $this->addSql('DROP TABLE messenger_messages');
    }
}
