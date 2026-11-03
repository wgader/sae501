<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261012085534 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE document_justificatif (id INT AUTO_INCREMENT NOT NULL, type_document VARCHAR(100) NOT NULL, fichier_url VARCHAR(500) NOT NULL, description LONGTEXT DEFAULT NULL, lie_atype VARCHAR(50) DEFAULT NULL, lie_aid INT DEFAULT NULL, created_at DATETIME NOT NULL, deleted_at DATETIME DEFAULT NULL, association_id INT NOT NULL, INDEX IDX_3D36E4ADEFB9C8A5 (association_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE document_justificatif ADD CONSTRAINT FK_3D36E4ADEFB9C8A5 FOREIGN KEY (association_id) REFERENCES association (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE document_justificatif DROP FOREIGN KEY FK_3D36E4ADEFB9C8A5');
        $this->addSql('DROP TABLE document_justificatif');
    }
}
