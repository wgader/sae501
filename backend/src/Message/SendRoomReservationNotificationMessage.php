<?php

declare(strict_types=1);

namespace App\Message;

final class SendRoomReservationNotificationMessage
{
    public function __construct(
        public readonly int $reservationSalleId,
    ) {
    }
}

