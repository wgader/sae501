<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261113101500 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Rend le motif des réservations de salle facultatif.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE reservation_salle MODIFY motif_evenement VARCHAR(255) DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE reservation_salle MODIFY motif_evenement VARCHAR(255) NOT NULL');
    }
}
