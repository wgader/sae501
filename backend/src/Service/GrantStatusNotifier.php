<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\DemandeSubvention;
use Psr\Log\LoggerInterface;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;

/**
 * Prévient l'association par e-mail quand son dossier de subvention est reçu puis instruit.
 */
final class GrantStatusNotifier
{
    public function __construct(
        private readonly MailerInterface $mailer,
        private readonly LoggerInterface $logger,
        #[Autowire(env: 'MAILER_FROM')] private readonly string $mailerFrom,
    ) {
    }

    public function notifySubmitted(DemandeSubvention $grant): void
    {
        $this->sendToAssociation(
            $grant,
            'Votre demande de subvention a bien été transmise — Mairie de Feytiat',
            'emails/grant_submitted.html.twig',
        );
    }

    public function notifyDecision(DemandeSubvention $grant): void
    {
        $status = $grant->getStatut();
        if ('Validée' === $status) {
            $this->sendToAssociation(
                $grant,
                'Votre demande de subvention a été acceptée — Mairie de Feytiat',
                'emails/grant_validated.html.twig',
            );
        } elseif ('Refusée' === $status) {
            $this->sendToAssociation(
                $grant,
                'Votre demande de subvention a été refusée — Mairie de Feytiat',
                'emails/grant_refused.html.twig',
            );
        }
    }

    private function sendToAssociation(DemandeSubvention $grant, string $subject, string $template): void
    {
        $association = $grant->getAssociation();
        if (null === $association) {
            return;
        }

        foreach ($association->getUsers() as $user) {
            $email = $user->getEmail();
            if (null === $email || '' === trim($email)) {
                continue;
            }

            // Un e-mail en échec ne doit pas annuler le changement de statut déjà enregistré.
            try {
                $this->mailer->send(
                    (new TemplatedEmail())
                        ->from(new Address($this->mailerFrom, 'Mairie de Feytiat'))
                        ->to($email)
                        ->subject($subject)
                        ->htmlTemplate($template)
                        ->context([
                            'prenom' => $user->getPrenom(),
                            'association' => $association,
                            'grant' => $grant,
                        ]),
                );
            } catch (TransportExceptionInterface $exception) {
                $this->logger->error('Envoi de l’e-mail de subvention impossible.', [
                    'grant' => $grant->getId(),
                    'exception' => $exception->getMessage(),
                ]);
            }
        }
    }
}
