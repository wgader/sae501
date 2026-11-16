<?php

declare(strict_types=1);

namespace App\Exception;

/**
 * Levée quand une demande de salle est déposée hors du circuit ouvert : demande de campagne sans
 * campagne ouverte, ou réservation ponctuelle pendant une campagne ou sur sa période réservable.
 */
final class RoomBookingClosedException extends \RuntimeException
{
    public const CAMPAIGN_CLOSED = 'ROOM_CAMPAIGN_CLOSED';
    public const ONE_OFF_CLOSED = 'ROOM_ONE_OFF_CLOSED';
    public const SLOT_IN_CAMPAIGN = 'ROOM_SLOT_IN_CAMPAIGN';

    public function __construct(
        string $message = 'Les demandes de campagne sont fermées : aucune campagne n’est ouverte. Utilisez la réservation ponctuelle depuis la page Salles.',
        private readonly string $reason = self::CAMPAIGN_CLOSED,
    ) {
        parent::__construct($message, 403);
    }

    public function getReason(): string
    {
        return $this->reason;
    }
}
