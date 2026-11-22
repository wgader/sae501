<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261122231930 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE campaign_wish (id INT AUTO_INCREMENT NOT NULL, day_of_week SMALLINT NOT NULL, start_time VARCHAR(5) NOT NULL, end_time VARCHAR(5) NOT NULL, frequency VARCHAR(20) NOT NULL, activity VARCHAR(120) NOT NULL, audience VARCHAR(20) NOT NULL, expected_attendance INT NOT NULL, type VARCHAR(20) NOT NULL, status VARCHAR(50) NOT NULL, decision_comment LONGTEXT DEFAULT NULL, decided_at DATETIME DEFAULT NULL, submission_id INT NOT NULL, salle_id INT NOT NULL, INDEX idx_campaign_wish_slot (salle_id, day_of_week), INDEX IDX_D6364F2BE1FD4933 (submission_id), INDEX IDX_D6364F2BDC304035 (salle_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE campaign_wish_submission (id INT AUTO_INCREMENT NOT NULL, submitted_at DATETIME NOT NULL, campaign_id INT NOT NULL, association_id INT NOT NULL, submitted_by_id INT DEFAULT NULL, INDEX IDX_EF1B38F6F639F774 (campaign_id), INDEX IDX_EF1B38F6EFB9C8A5 (association_id), INDEX IDX_EF1B38F679F7D87D (submitted_by_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE campaign_wish ADD CONSTRAINT FK_D6364F2BE1FD4933 FOREIGN KEY (submission_id) REFERENCES campaign_wish_submission (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE campaign_wish ADD CONSTRAINT FK_D6364F2BDC304035 FOREIGN KEY (salle_id) REFERENCES salle (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE campaign_wish_submission ADD CONSTRAINT FK_EF1B38F6F639F774 FOREIGN KEY (campaign_id) REFERENCES campaign (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE campaign_wish_submission ADD CONSTRAINT FK_EF1B38F6EFB9C8A5 FOREIGN KEY (association_id) REFERENCES association (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE campaign_wish_submission ADD CONSTRAINT FK_EF1B38F679F7D87D FOREIGN KEY (submitted_by_id) REFERENCES `user` (id) ON DELETE SET NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE campaign_wish DROP FOREIGN KEY FK_D6364F2BE1FD4933');
        $this->addSql('ALTER TABLE campaign_wish DROP FOREIGN KEY FK_D6364F2BDC304035');
        $this->addSql('ALTER TABLE campaign_wish_submission DROP FOREIGN KEY FK_EF1B38F6F639F774');
        $this->addSql('ALTER TABLE campaign_wish_submission DROP FOREIGN KEY FK_EF1B38F6EFB9C8A5');
        $this->addSql('ALTER TABLE campaign_wish_submission DROP FOREIGN KEY FK_EF1B38F679F7D87D');
        $this->addSql('DROP TABLE campaign_wish');
        $this->addSql('DROP TABLE campaign_wish_submission');
    }
}
