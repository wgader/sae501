<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261012081755 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE association ADD module_subvention_actif TINYINT DEFAULT 0 NOT NULL, ADD module_materiel_actif TINYINT DEFAULT 0 NOT NULL, ADD module_salle_actif TINYINT DEFAULT 0 NOT NULL, ADD valide_at DATETIME DEFAULT NULL, CHANGE numero_rna numero_rna VARCHAR(20) DEFAULT NULL, CHANGE numero_siret numero_siret VARCHAR(14) DEFAULT NULL, CHANGE date_creation date_creation DATE DEFAULT NULL, CHANGE nombre_membres nombre_membres INT DEFAULT NULL, CHANGE categorie_activite categorie_activite VARCHAR(50) DEFAULT NULL, CHANGE objet objet LONGTEXT DEFAULT NULL, CHANGE adresse_siege_social adresse_siege_social VARCHAR(255) DEFAULT NULL, CHANGE site_web site_web VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE user ADD activation_token VARCHAR(100) DEFAULT NULL, DROP email_verification_code, CHANGE password password VARCHAR(255) DEFAULT NULL, CHANGE telephone telephone VARCHAR(20) DEFAULT NULL, CHANGE email_verification_code_expires_at activation_token_expires_at DATETIME DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE association DROP module_subvention_actif, DROP module_materiel_actif, DROP module_salle_actif, DROP valide_at, CHANGE numero_rna numero_rna VARCHAR(20) NOT NULL, CHANGE numero_siret numero_siret VARCHAR(14) NOT NULL, CHANGE date_creation date_creation DATE NOT NULL, CHANGE nombre_membres nombre_membres INT NOT NULL, CHANGE categorie_activite categorie_activite VARCHAR(50) NOT NULL, CHANGE objet objet LONGTEXT NOT NULL, CHANGE adresse_siege_social adresse_siege_social VARCHAR(255) NOT NULL, CHANGE site_web site_web VARCHAR(255) NOT NULL');
        $this->addSql('ALTER TABLE `user` ADD email_verification_code VARCHAR(6) DEFAULT NULL, DROP activation_token, CHANGE password password VARCHAR(255) NOT NULL, CHANGE telephone telephone VARCHAR(20) NOT NULL, CHANGE activation_token_expires_at email_verification_code_expires_at DATETIME DEFAULT NULL');
    }
}
