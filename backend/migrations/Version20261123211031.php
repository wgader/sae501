<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261123211031 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE faq_item (id INT AUTO_INCREMENT NOT NULL, question VARCHAR(255) NOT NULL, answer LONGTEXT NOT NULL, display_order INT DEFAULT 0 NOT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE grant_document_type (id INT AUTO_INCREMENT NOT NULL, label VARCHAR(150) NOT NULL, is_required TINYINT DEFAULT 0 NOT NULL, display_order INT DEFAULT 0 NOT NULL, UNIQUE INDEX UNIQ_3279D2EEA750E8 (label), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE grant_resource (id INT AUTO_INCREMENT NOT NULL, label VARCHAR(255) NOT NULL, url VARCHAR(500) NOT NULL, is_external TINYINT DEFAULT 0 NOT NULL, display_order INT DEFAULT 0 NOT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE legal_content (id INT AUTO_INCREMENT NOT NULL, type VARCHAR(50) NOT NULL, title VARCHAR(255) NOT NULL, subtitle VARCHAR(255) DEFAULT NULL, last_updated VARCHAR(50) DEFAULT NULL, sections JSON NOT NULL, updated_at DATETIME DEFAULT NULL, updated_by_id INT DEFAULT NULL, UNIQUE INDEX UNIQ_39FEAEC78CDE5729 (type), INDEX IDX_39FEAEC7896DBBDE (updated_by_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE legal_content ADD CONSTRAINT FK_39FEAEC7896DBBDE FOREIGN KEY (updated_by_id) REFERENCES `user` (id) ON DELETE SET NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE legal_content DROP FOREIGN KEY FK_39FEAEC7896DBBDE');
        $this->addSql('DROP TABLE faq_item');
        $this->addSql('DROP TABLE grant_document_type');
        $this->addSql('DROP TABLE grant_resource');
        $this->addSql('DROP TABLE legal_content');
    }
}
