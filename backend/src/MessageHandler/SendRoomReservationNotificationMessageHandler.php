<?php

declare(strict_types=1);

namespace App\MessageHandler;

use App\Message\SendRoomReservationNotificationMessage;
use App\Service\RoomReservationStatusNotifier;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final class SendRoomReservationNotificationMessageHandler
{
    public function __construct(
        private readonly RoomReservationStatusNotifier $notifier,
    ) {
    }

    public function __invoke(SendRoomReservationNotificationMessage $message): void
    {
        $this->notifier->notifySubmitted($message->reservationSalleId);
    }
}

