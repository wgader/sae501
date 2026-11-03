<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261012083259 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE association DROP numero_rna, DROP numero_siret, DROP date_creation, DROP categorie_activite, DROP objet, DROP adresse_siege_social, DROP site_web');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE association ADD numero_rna VARCHAR(20) DEFAULT NULL, ADD numero_siret VARCHAR(14) DEFAULT NULL, ADD date_creation DATE DEFAULT NULL, ADD categorie_activite VARCHAR(50) DEFAULT NULL, ADD objet LONGTEXT DEFAULT NULL, ADD adresse_siege_social VARCHAR(255) DEFAULT NULL, ADD site_web VARCHAR(255) DEFAULT NULL');
    }
}
