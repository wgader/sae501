<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260916045501 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE user ADD nom VARCHAR(100) NOT NULL, ADD prenom VARCHAR(100) NOT NULL, ADD telephone VARCHAR(20) NOT NULL, ADD type_compte VARCHAR(20) NOT NULL, ADD is_verified TINYINT NOT NULL, ADD created_at DATETIME NOT NULL, ADD association_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE user ADD CONSTRAINT FK_8D93D649EFB9C8A5 FOREIGN KEY (association_id) REFERENCES association (id)');
        $this->addSql('CREATE INDEX IDX_8D93D649EFB9C8A5 ON user (association_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE `user` DROP FOREIGN KEY FK_8D93D649EFB9C8A5');
        $this->addSql('DROP INDEX IDX_8D93D649EFB9C8A5 ON `user`');
        $this->addSql('ALTER TABLE `user` DROP nom, DROP prenom, DROP telephone, DROP type_compte, DROP is_verified, DROP created_at, DROP association_id');
    }
}
