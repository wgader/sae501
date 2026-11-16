<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261116032033 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE reservation_salle ADD decision_comment LONGTEXT DEFAULT NULL, ADD campaign_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE reservation_salle ADD CONSTRAINT FK_DE8AEFBF639F774 FOREIGN KEY (campaign_id) REFERENCES campaign (id) ON DELETE SET NULL');
        $this->addSql('CREATE INDEX IDX_DE8AEFBF639F774 ON reservation_salle (campaign_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE reservation_salle DROP FOREIGN KEY FK_DE8AEFBF639F774');
        $this->addSql('DROP INDEX IDX_DE8AEFBF639F774 ON reservation_salle');
        $this->addSql('ALTER TABLE reservation_salle DROP decision_comment, DROP campaign_id');
    }
}
