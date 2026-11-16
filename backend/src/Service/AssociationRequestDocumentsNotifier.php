<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\ReservationMateriel;
use App\Entity\ReservationSalle;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;

final class AssociationRequestDocumentsNotifier
{
    public function __construct(
        private readonly MailerInterface $mailer,
        private readonly NotificationService $notificationService,
        #[Autowire(env: 'MAILER_FROM')] private readonly string $mailerFrom,
        #[Autowire(env: 'FRONTEND_URL')] private readonly string $frontendUrl,
    ) {
    }

    /**
     * @param list<string> $missingFiles
     */
    public function notify(
        ReservationMateriel|ReservationSalle $reservation,
        array $missingFiles,
        string $message,
    ): void {
        $association = $reservation->getAssociation();
        if ($association === null) {
            return;
        }

        $subject = 'Pièces complémentaires demandées — Mairie de Feytiat';
        foreach ($association->getUsers() as $user) {
            $this->notificationService->createForUser(
                $user,
                'Pièces complémentaires demandées',
                $message,
                $reservation instanceof ReservationSalle
                    ? 'SALLE_DOCUMENTS_REQUESTED'
                    : 'MATERIEL_DOCUMENTS_REQUESTED',
                $reservation->getId(),
            );

            if ($user->getEmail() === null || trim($user->getEmail()) === '') {
                continue;
            }

            $this->mailer->send(
                (new TemplatedEmail())
                    ->from(new Address($this->mailerFrom, 'Mairie de Feytiat'))
                    ->to($user->getEmail())
                    ->subject($subject)
                    ->htmlTemplate('emails/request_documents_requested.html.twig')
                    ->context([
                        'prenom' => $user->getPrenom(),
                        'nomAssociation' => $association->getNom(),
                        'requestLabel' => $reservation instanceof ReservationSalle
                            ? 'votre réservation de salle'
                            : 'votre réservation de matériel',
                        'missingFiles' => $missingFiles,
                        'message' => $message,
                        'documentsUrl' => rtrim($this->frontendUrl, '/')
                            . '/historique/' . $reservation->getId()
                            . '/pieces-annexes?type='
                            . ($reservation instanceof ReservationSalle ? 'salle' : 'materiel'),
                    ]),
            );
        }
    }
}
