<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;

/**
 * Invite un agent à choisir lui-même son mot de passe : la mairie n'en connaît ni n'en transmet aucun.
 */
final class AgentInvitationMailer
{
    private const TOKEN_LIFETIME = '+72 hours';

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly MailerInterface $mailer,
        private readonly LoggerInterface $logger,
        #[Autowire(env: 'MAILER_FROM')] private readonly string $mailerFrom,
        #[Autowire(env: 'FRONTEND_URL')] private readonly string $frontendUrl,
    ) {
    }

    /**
     * Émet un nouveau lien, ce qui invalide le précédent.
     *
     * @return bool faux si l'e-mail n'a pas pu partir : l'invitation pourra être renvoyée
     */
    public function send(User $agent): bool
    {
        $token = bin2hex(random_bytes(32));
        $agent->setActivationToken($token);
        $agent->setActivationTokenExpiresAt(new \DateTimeImmutable(self::TOKEN_LIFETIME));
        $this->entityManager->flush();

        $activationUrl = \sprintf(
            '%s/activer-compte#token=%s&ref=%s&espace=mairie',
            rtrim($this->frontendUrl, '/'),
            rawurlencode($token),
            rawurlencode(base64_encode((string) $agent->getEmail())),
        );

        try {
            $this->mailer->send(
                (new TemplatedEmail())
                    ->from(new Address($this->mailerFrom, 'Mairie de Feytiat'))
                    ->to((string) $agent->getEmail())
                    ->subject('Activez votre compte agent — Mairie de Feytiat')
                    ->htmlTemplate('emails/agent_invitation.html.twig')
                    ->context(['prenom' => $agent->getPrenom(), 'activationUrl' => $activationUrl]),
            );

            return true;
        } catch (\Throwable $exception) {
            $this->logger->error('agent_invitation: e-mail non envoyé', [
                'agent' => $agent->getId(),
                'exception' => $exception->getMessage(),
            ]);

            return false;
        }
    }
}
