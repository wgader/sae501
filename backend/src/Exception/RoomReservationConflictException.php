<?php

declare(strict_types=1);

namespace App\Exception;

final class RoomReservationConflictException extends \RuntimeException
{
    /**
     * @param list<array<string, mixed>> $conflicts
     */
    public function __construct(
        string $message = "Ce créneau horaire vient d'être réservé par un autre usager ou chevauche une réservation existante.",
        private readonly array $conflicts = [],
        int $code = 409,
        ?\Throwable $previous = null,
    ) {
        parent::__construct($message, $code, $previous);
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function getConflicts(): array
    {
        return $this->conflicts;
    }
}

