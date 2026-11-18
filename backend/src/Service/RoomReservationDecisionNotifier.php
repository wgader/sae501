<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\ReservationSalle;
use Psr\Log\LoggerInterface;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;

/**
 * Prévient les membres d’une association d’une décision de la mairie sur une réservation de salle :
 * notification dans l’application et e-mail.
 */
final class RoomReservationDecisionNotifier
{
    public const DECISION_ACCEPTED = 'accepted';
    public const DECISION_REFUSED = 'refused';
    public const DECISION_RESCHEDULED = 'rescheduled';
    public const DECISION_ADDED = 'added';
    public const DECISION_CONFLICT = 'conflict';

    /** Type lu par la cloche de notifications pour ouvrir le détail de la demande. */
    public const NOTIFICATION_TYPE = 'SALLE_RESERVATION_DECISION';

    /**
     * @var array<string, array{title: string, intro: string}>
     */
    private const MESSAGES = [
        self::DECISION_ACCEPTED => [
            'title' => 'Réservation de salle acceptée',
            'intro' => 'La mairie a accepté votre demande de réservation de salle.',
        ],
        self::DECISION_REFUSED => [
            'title' => 'Réservation de salle refusée',
            'intro' => 'La mairie n’a pas pu accepter votre demande de réservation de salle.',
        ],
        self::DECISION_RESCHEDULED => [
            'title' => 'Réservation de salle modifiée',
            'intro' => 'La mairie a modifié votre réservation de salle (salle, jour ou horaire). Elle est acceptée avec les informations ci-dessous.',
        ],
        self::DECISION_ADDED => [
            'title' => 'Nouveau créneau de salle proposé',
            'intro' => 'La mairie a ajouté une demande de salle pour votre association. Elle sera confirmée après la réunion d’arbitrage.',
        ],
        self::DECISION_CONFLICT => [
            'title' => 'Créneau demandé par plusieurs associations',
            'intro' => 'D’autres associations ont demandé la même salle sur ce créneau. La mairie vous départagera lors de la réunion d’arbitrage : votre demande reste en attente.',
        ],
    ];

    public function __construct(
        private readonly MailerInterface $mailer,
        private readonly NotificationService $notificationService,
        private readonly LoggerInterface $logger,
        #[Autowire(env: 'MAILER_FROM')] private readonly string $mailerFrom,
    ) {
    }

    /**
     * Crée les notifications (à enregistrer par l’appelant via flush) puis envoie les e-mails.
     */
    public function notify(ReservationSalle $reservation, string $decision): void
    {
        $message = self::MESSAGES[$decision] ?? throw new \InvalidArgumentException('Décision inconnue.');
        $association = $reservation->getAssociation();
        $salle = $reservation->getSalle();
        if (null === $association || null === $salle) {
            return;
        }

        $summary = \sprintf(
            '%s — %s, %s.',
            $message['intro'],
            $salle->getNom(),
            $reservation->getSlotLabel(),
        );
        if (null !== $reservation->getDecisionComment()) {
            $summary .= ' Message de la mairie : '.$reservation->getDecisionComment();
        }

        foreach ($association->getUsers() as $user) {
            $this->notificationService->createForUser($user, $message['title'], $summary, self::NOTIFICATION_TYPE, $reservation->getId());

            $email = $user->getEmail();
            if (null === $email || '' === trim($email)) {
                continue;
            }

            try {
                $this->mailer->send(
                    (new TemplatedEmail())
                        ->from(new Address($this->mailerFrom, 'Mairie de Feytiat'))
                        ->to($email)
                        ->subject($message['title'].' — Mairie de Feytiat')
                        ->htmlTemplate('emails/room_reservation_decision.html.twig')
                        ->context([
                            'title' => $message['title'],
                            'intro' => $message['intro'],
                            'prenom' => $user->getPrenom(),
                            'reservation' => $reservation,
                            'association' => $association,
                            'salle' => $salle,
                            'campaign' => $reservation->getCampaign(),
                        ]),
                );
            } catch (\Throwable $exception) {
                // La décision est enregistrée même si l’e-mail ne part pas : la notification reste visible.
                $this->logger->warning('E-mail de décision de réservation non envoyé.', [
                    'reservation' => $reservation->getId(),
                    'exception' => $exception->getMessage(),
                ]);
            }
        }
    }
}
