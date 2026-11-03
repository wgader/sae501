<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261029100000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajoute les metadonnees de securite aux fichiers joints des evenements';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE external_event_file ADD mime_type VARCHAR(100) DEFAULT NULL, ADD file_size INT DEFAULT NULL, ADD sha256 VARCHAR(64) DEFAULT NULL, ADD created_at DATETIME DEFAULT NULL');
        $this->addSql("UPDATE external_event_file SET mime_type = 'application/octet-stream', file_size = 0, sha256 = REPEAT('0', 64), created_at = NOW() WHERE mime_type IS NULL");
        $this->addSql('ALTER TABLE external_event_file MODIFY mime_type VARCHAR(100) NOT NULL, MODIFY file_size INT NOT NULL, MODIFY sha256 VARCHAR(64) NOT NULL, MODIFY created_at DATETIME NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE external_event_file DROP mime_type, DROP file_size, DROP sha256, DROP created_at');
    }
}
