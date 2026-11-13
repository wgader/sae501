<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261108213000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajoute le module événements aux associations.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE association ADD module_evenement_actif TINYINT DEFAULT 1 NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE association DROP module_evenement_actif');
    }
}
