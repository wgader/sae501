<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261123120616 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE app_settings (id INT AUTO_INCREMENT NOT NULL, room_opening_hour SMALLINT NOT NULL, room_closing_hour SMALLINT NOT NULL, room_one_off_max_days SMALLINT NOT NULL, equipment_desk_opening VARCHAR(5) NOT NULL, equipment_desk_closing VARCHAR(5) NOT NULL, equipment_pickup_location VARCHAR(255) DEFAULT NULL, equipment_max_quantity_per_request INT DEFAULT NULL, equipment_default_max_days SMALLINT NOT NULL, updated_at DATETIME DEFAULT NULL, updated_by_id INT DEFAULT NULL, INDEX IDX_EDC5C068896DBBDE (updated_by_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE equipment_category (id INT AUTO_INCREMENT NOT NULL, code VARCHAR(100) NOT NULL, label VARCHAR(100) NOT NULL, UNIQUE INDEX uniq_equipment_category_code (code), UNIQUE INDEX uniq_equipment_category_label (label), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE app_settings ADD CONSTRAINT FK_EDC5C068896DBBDE FOREIGN KEY (updated_by_id) REFERENCES `user` (id) ON DELETE SET NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE app_settings DROP FOREIGN KEY FK_EDC5C068896DBBDE');
        $this->addSql('DROP TABLE app_settings');
        $this->addSql('DROP TABLE equipment_category');
    }
}
