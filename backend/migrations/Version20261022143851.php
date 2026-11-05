<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261022143851 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            CREATE TABLE stock_adjustment (
              id INT AUTO_INCREMENT NOT NULL,
              previous_stock INT NOT NULL,
              new_stock INT NOT NULL,
              reason VARCHAR(100) NOT NULL,
              created_at DATETIME NOT NULL,
              materiel_id INT NOT NULL,
              agent_id INT NOT NULL,
              INDEX IDX_27B08FBA16880AAF (materiel_id),
              INDEX IDX_27B08FBA3414710B (agent_id),
              PRIMARY KEY (id)
            ) DEFAULT CHARACTER SET utf8mb4
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE
              stock_adjustment
            ADD
              CONSTRAINT FK_27B08FBA16880AAF FOREIGN KEY (materiel_id) REFERENCES materiel (id) ON DELETE RESTRICT
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE
              stock_adjustment
            ADD
              CONSTRAINT FK_27B08FBA3414710B FOREIGN KEY (agent_id) REFERENCES `user` (id) ON DELETE RESTRICT
        SQL);
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE stock_adjustment DROP FOREIGN KEY FK_27B08FBA16880AAF');
        $this->addSql('ALTER TABLE stock_adjustment DROP FOREIGN KEY FK_27B08FBA3414710B');
        $this->addSql('DROP TABLE stock_adjustment');
    }
}
