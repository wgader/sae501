<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261103100426 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Remplace la table legacy notifications par notification en conservant les données';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE notification (id INT AUTO_INCREMENT NOT NULL, title VARCHAR(255) NOT NULL, message LONGTEXT NOT NULL, type VARCHAR(50) NOT NULL, event_id INT DEFAULT NULL, read_at DATETIME DEFAULT NULL, created_at DATETIME NOT NULL, user_id INT NOT NULL, INDEX idx_notification_user_read (user_id, read_at), INDEX IDX_BF5476CAA76ED395 (user_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE notification ADD CONSTRAINT FK_BF5476CAA76ED395 FOREIGN KEY (user_id) REFERENCES `user` (id) ON DELETE CASCADE');

        if ($schema->hasTable('notifications')) {
            $this->addSql('INSERT INTO notification (id, user_id, title, message, type, event_id, read_at, created_at) SELECT id, user_id, titre, message, type, event_id, reat_at, created_at FROM notifications');
            $this->addSql('DROP TABLE notifications');
        }
    }

    public function down(Schema $schema): void
    {
        $this->addSql('CREATE TABLE notifications (id INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, titre VARCHAR(255) NOT NULL, message LONGTEXT NOT NULL, type VARCHAR(50) NOT NULL, event_id INT DEFAULT NULL, reat_at DATETIME DEFAULT NULL, created_at DATETIME NOT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('INSERT INTO notifications (id, user_id, titre, message, type, event_id, reat_at, created_at) SELECT id, user_id, title, message, type, event_id, read_at, created_at FROM notification');
        $this->addSql('ALTER TABLE notification DROP FOREIGN KEY FK_BF5476CAA76ED395');
        $this->addSql('DROP TABLE notification');
    }
}
