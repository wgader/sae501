<?php

namespace App\Exception;

class StockConflictException extends \RuntimeException
{
    /**
     * @param array<int, array<string, mixed>> $conflicts
     */
    public function __construct(
        string $message,
        private readonly array $conflicts = [],
        private readonly int $maxBooked = 0,
        int $code = 409,
        ?\Throwable $previous = null,
    ) {
        parent::__construct($message, $code, $previous);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function getConflicts(): array
    {
        return $this->conflicts;
    }

    public function getMaxBooked(): int
    {
        return $this->maxBooked;
    }
}

