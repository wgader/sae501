<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261015180525 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Modules association actifs par défaut (true)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE association CHANGE module_subvention_actif module_subvention_actif TINYINT DEFAULT 1 NOT NULL, CHANGE module_materiel_actif module_materiel_actif TINYINT DEFAULT 1 NOT NULL, CHANGE module_salle_actif module_salle_actif TINYINT DEFAULT 1 NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE association CHANGE module_subvention_actif module_subvention_actif TINYINT DEFAULT 0 NOT NULL, CHANGE module_materiel_actif module_materiel_actif TINYINT DEFAULT 0 NOT NULL, CHANGE module_salle_actif module_salle_actif TINYINT DEFAULT 0 NOT NULL');
    }
}