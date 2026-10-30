<?php

declare(strict_types=1);

namespace App\Exception;

final class EquipmentReservationConflictException extends \RuntimeException
{
    /**
     * @param array<int, array{requested: int, available: int}> $conflicts
     */
    public function __construct(
        string $message,
        private readonly array $conflicts,
    ) {
        parent::__construct($message);
    }

    /**
     * @return array<int, array{requested: int, available: int}>
     */
    public function getConflicts(): array
    {
        return $this->conflicts;
    }
}
