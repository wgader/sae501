<?php

namespace App\Service;

use App\Entity\Notification;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;

final class NotificationService
{
    public function __construct(private readonly EntityManagerInterface $entityManager)
    {
    }

    public function createForUser(
        User $user,
        string $title,
        string $message,
        string $type,
        ?int $eventId = null,
    ): Notification {
        $notification = (new Notification())
            ->setUser($user)->setTitle($title)->setMessage($message)
            ->setType($type)->setEventId($eventId);
        $this->entityManager->persist($notification);

        return $notification;
    }
}
