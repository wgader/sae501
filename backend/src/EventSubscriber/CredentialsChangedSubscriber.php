<?php

declare(strict_types=1);

namespace App\EventSubscriber;

use App\Repository\UserRepository;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTDecodedEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Events;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

/**
 * Refuse les JWT émis avant le dernier changement de mot de passe : une réinitialisation
 * déconnecte toutes les sessions ouvertes, y compris celle d’un éventuel attaquant.
 */
final class CredentialsChangedSubscriber implements EventSubscriberInterface
{
    public function __construct(private readonly UserRepository $userRepository)
    {
    }

    public static function getSubscribedEvents(): array
    {
        return [Events::JWT_DECODED => 'onJwtDecoded'];
    }

    public function onJwtDecoded(JWTDecodedEvent $event): void
    {
        $payload = $event->getPayload();
        $identifier = $payload['username'] ?? null;
        $issuedAt = $payload['iat'] ?? null;
        if (!\is_string($identifier) || !is_numeric($issuedAt)) {
            return;
        }

        $changedAt = $this->userRepository->findOneBy(['email' => $identifier])?->getCredentialsChangedAt();
        if (null !== $changedAt && (int) $issuedAt < $changedAt->getTimestamp()) {
            $event->markAsInvalid();
        }
    }
}
