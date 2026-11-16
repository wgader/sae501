<?php

declare(strict_types=1);

namespace App\Exception;

/**
 * Levée quand une association dépose une demande de salle alors qu'aucune campagne n'est ouverte.
 */
final class RoomBookingClosedException extends \RuntimeException
{
    public function __construct(
        string $message = 'Les demandes de salle sont fermées : aucune campagne n’est ouverte. Contactez la mairie pour toute demande.',
        ?\Throwable $previous = null,
    ) {
        parent::__construct($message, 403, $previous);
    }
}
