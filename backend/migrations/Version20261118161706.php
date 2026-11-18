<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261118161706 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE demande_subvention_ligne_budget (id INT AUTO_INCREMENT NOT NULL, type_ligne VARCHAR(20) NOT NULL, categorie VARCHAR(60) NOT NULL, intitule VARCHAR(255) NOT NULL, montant NUMERIC(10, 2) NOT NULL, demande_subvention_id INT NOT NULL, INDEX IDX_F57E84B54A198BFC (demande_subvention_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE demande_subvention_ligne_budget ADD CONSTRAINT FK_F57E84B54A198BFC FOREIGN KEY (demande_subvention_id) REFERENCES demande_subvention (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE demande_subvention ADD public_cible LONGTEXT DEFAULT NULL, ADD date_debut_projet DATE DEFAULT NULL, ADD date_fin_projet DATE DEFAULT NULL, ADD budget_valide TINYINT DEFAULT 0 NOT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE demande_subvention_ligne_budget DROP FOREIGN KEY FK_F57E84B54A198BFC');
        $this->addSql('DROP TABLE demande_subvention_ligne_budget');
        $this->addSql('ALTER TABLE demande_subvention DROP public_cible, DROP date_debut_projet, DROP date_fin_projet, DROP budget_valide');
    }
}
