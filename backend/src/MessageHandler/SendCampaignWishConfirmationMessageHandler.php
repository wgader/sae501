<?php

declare(strict_types=1);

namespace App\MessageHandler;

use App\Message\SendCampaignWishConfirmationMessage;
use App\Service\CampaignWishNotifier;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final class SendCampaignWishConfirmationMessageHandler
{
    public function __construct(private readonly CampaignWishNotifier $notifier)
    {
    }

    public function __invoke(SendCampaignWishConfirmationMessage $message): void
    {
        $this->notifier->notifySubmitted($message->submissionId);
    }
}
