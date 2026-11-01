<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Platforms\SqlitePlatform;
use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Migration for DemandeSubvention, ReservationSalle, DemandeStatusHistory and ReservationMateriel observations.
 * Supports both MySQL and SQLite.
 */
final class Version20261101120422 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create tables for subventions, room reservations and request status history';
    }

    public function up(Schema $schema): void
    {
        $platform = $this->connection->getDatabasePlatform();

        if ($platform instanceof SqlitePlatform) {
            $this->addSql('CREATE TABLE demande_status_history (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, demande_type VARCHAR(30) NOT NULL, demande_id INTEGER NOT NULL, statut VARCHAR(50) NOT NULL, label VARCHAR(255) NOT NULL, commentaire CLOB DEFAULT NULL, auteur VARCHAR(100) DEFAULT NULL, created_at DATETIME NOT NULL)');
            $this->addSql('CREATE INDEX idx_demande_lookup ON demande_status_history (demande_type, demande_id)');
            $this->addSql('CREATE TABLE demande_subvention (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, intitule_projet VARCHAR(255) NOT NULL, type_subvention VARCHAR(50) NOT NULL, description CLOB DEFAULT NULL, montant_demande NUMERIC(10, 2) NOT NULL, montant_accorde NUMERIC(10, 2) DEFAULT NULL, annee_exercice INTEGER NOT NULL, statut VARCHAR(50) NOT NULL, observations CLOB DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, association_id INTEGER NOT NULL, CONSTRAINT FK_3A753397EFB9C8A5 FOREIGN KEY (association_id) REFERENCES association (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
            $this->addSql('CREATE INDEX IDX_3A753397EFB9C8A5 ON demande_subvention (association_id)');
            $this->addSql('CREATE TABLE reservation_salle (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, motif_evenement VARCHAR(255) NOT NULL, date_debut DATETIME NOT NULL, date_fin DATETIME NOT NULL, capacite_attendue INTEGER DEFAULT NULL, statut VARCHAR(50) NOT NULL, observations CLOB DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, association_id INTEGER NOT NULL, salle_id INTEGER NOT NULL, CONSTRAINT FK_DE8AEFBEFB9C8A5 FOREIGN KEY (association_id) REFERENCES association (id) NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_DE8AEFBDC304035 FOREIGN KEY (salle_id) REFERENCES salle (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
            $this->addSql('CREATE INDEX IDX_DE8AEFBEFB9C8A5 ON reservation_salle (association_id)');
            $this->addSql('CREATE INDEX IDX_DE8AEFBDC304035 ON reservation_salle (salle_id)');
            $this->addSql('ALTER TABLE reservation_materiel ADD COLUMN observations CLOB DEFAULT NULL');
            return;
        }

        $this->addSql('CREATE TABLE demande_status_history (id INT AUTO_INCREMENT NOT NULL, demande_type VARCHAR(30) NOT NULL, demande_id INT NOT NULL, statut VARCHAR(50) NOT NULL, label VARCHAR(255) NOT NULL, commentaire LONGTEXT DEFAULT NULL, auteur VARCHAR(100) DEFAULT NULL, created_at DATETIME NOT NULL, INDEX idx_demande_lookup (demande_type, demande_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE demande_subvention (id INT AUTO_INCREMENT NOT NULL, association_id INT NOT NULL, intitule_projet VARCHAR(255) NOT NULL, type_subvention VARCHAR(50) NOT NULL, description LONGTEXT DEFAULT NULL, montant_demande NUMERIC(10, 2) NOT NULL, montant_accorde NUMERIC(10, 2) DEFAULT NULL, annee_exercice INT NOT NULL, statut VARCHAR(50) NOT NULL, observations LONGTEXT DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, INDEX IDX_3A753397EFB9C8A5 (association_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE reservation_salle (id INT AUTO_INCREMENT NOT NULL, association_id INT NOT NULL, salle_id INT NOT NULL, motif_evenement VARCHAR(255) NOT NULL, date_debut DATETIME NOT NULL, date_fin DATETIME NOT NULL, capacite_attendue INT DEFAULT NULL, statut VARCHAR(50) NOT NULL, observations LONGTEXT DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, INDEX IDX_DE8AEFBEFB9C8A5 (association_id), INDEX IDX_DE8AEFBDC304035 (salle_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE demande_subvention ADD CONSTRAINT FK_3A753397EFB9C8A5 FOREIGN KEY (association_id) REFERENCES association (id)');
        $this->addSql('ALTER TABLE reservation_salle ADD CONSTRAINT FK_DE8AEFBEFB9C8A5 FOREIGN KEY (association_id) REFERENCES association (id)');
        $this->addSql('ALTER TABLE reservation_salle ADD CONSTRAINT FK_DE8AEFBDC304035 FOREIGN KEY (salle_id) REFERENCES salle (id)');
        $this->addSql('ALTER TABLE reservation_materiel ADD observations LONGTEXT DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $platform = $this->connection->getDatabasePlatform();

        if ($platform instanceof SqlitePlatform) {
            $this->addSql('DROP TABLE demande_status_history');
            $this->addSql('DROP TABLE demande_subvention');
            $this->addSql('DROP TABLE reservation_salle');
            return;
        }

        $this->addSql('ALTER TABLE demande_subvention DROP FOREIGN KEY FK_3A753397EFB9C8A5');
        $this->addSql('ALTER TABLE reservation_salle DROP FOREIGN KEY FK_DE8AEFBEFB9C8A5');
        $this->addSql('ALTER TABLE reservation_salle DROP FOREIGN KEY FK_DE8AEFBDC304035');
        $this->addSql('DROP TABLE demande_status_history');
        $this->addSql('DROP TABLE demande_subvention');
        $this->addSql('DROP TABLE reservation_salle');
        $this->addSql('ALTER TABLE reservation_materiel DROP COLUMN observations');
    }
}
