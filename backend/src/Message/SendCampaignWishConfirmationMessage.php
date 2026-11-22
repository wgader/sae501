<?php

declare(strict_types=1);

namespace App\Message;

/** Accusé de réception d'un dossier de vœux, envoyé hors de la requête par le worker. */
final readonly class SendCampaignWishConfirmationMessage
{
    public function __construct(public int $submissionId)
    {
    }
}
