<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261022124303 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE materiel (id INT AUTO_INCREMENT NOT NULL, designation VARCHAR(255) NOT NULL, categorie VARCHAR(100) NOT NULL, reference_interne VARCHAR(50) DEFAULT NULL, description LONGTEXT DEFAULT NULL, consignes_utilisation LONGTEXT DEFAULT NULL, stock_total INT NOT NULL, is_archived TINYINT DEFAULT 0 NOT NULL, image_path VARCHAR(255) DEFAULT NULL, created_at DATETIME NOT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE reservation_materiel (id INT AUTO_INCREMENT NOT NULL, motif_evenement VARCHAR(255) NOT NULL, date_retrait DATETIME NOT NULL, date_restitution DATETIME NOT NULL, statut VARCHAR(50) NOT NULL, caution_montant NUMERIC(10, 2) DEFAULT NULL, caution_payee_at DATETIME DEFAULT NULL, materiel_retire_at DATETIME DEFAULT NULL, materiel_restitue_at DATETIME DEFAULT NULL, caution_rendue_at DATETIME DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, association_id INT NOT NULL, INDEX IDX_85675285EFB9C8A5 (association_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE reservation_materiel_ligne (id INT AUTO_INCREMENT NOT NULL, quantite INT NOT NULL, reservation_materiel_id INT NOT NULL, materiel_id INT NOT NULL, INDEX IDX_9069380EDAE4D7F3 (reservation_materiel_id), INDEX IDX_9069380E16880AAF (materiel_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE reservation_materiel ADD CONSTRAINT FK_85675285EFB9C8A5 FOREIGN KEY (association_id) REFERENCES association (id)');
        $this->addSql('ALTER TABLE reservation_materiel_ligne ADD CONSTRAINT FK_9069380EDAE4D7F3 FOREIGN KEY (reservation_materiel_id) REFERENCES reservation_materiel (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE reservation_materiel_ligne ADD CONSTRAINT FK_9069380E16880AAF FOREIGN KEY (materiel_id) REFERENCES materiel (id) ON DELETE RESTRICT');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE reservation_materiel DROP FOREIGN KEY FK_85675285EFB9C8A5');
        $this->addSql('ALTER TABLE reservation_materiel_ligne DROP FOREIGN KEY FK_9069380EDAE4D7F3');
        $this->addSql('ALTER TABLE reservation_materiel_ligne DROP FOREIGN KEY FK_9069380E16880AAF');
        $this->addSql('DROP TABLE materiel');
        $this->addSql('DROP TABLE reservation_materiel');
        $this->addSql('DROP TABLE reservation_materiel_ligne');
    }
}
