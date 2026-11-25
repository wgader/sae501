<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261124112332 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE campaign_wish ADD start_date DATE DEFAULT NULL');
        $this->addSql('UPDATE campaign_wish wish
            INNER JOIN campaign_wish_submission submission ON submission.id = wish.submission_id
            INNER JOIN campaign campaign ON campaign.id = submission.campaign_id
            SET wish.start_date = COALESCE(
                campaign.period_start,
                MAKEDATE(YEAR(campaign.opening_at) + 1, 1)
            )');
        $this->addSql('ALTER TABLE campaign_wish MODIFY start_date DATE NOT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE campaign_wish DROP start_date');
    }
}
