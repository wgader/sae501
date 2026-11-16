<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\ReservationMateriel;
use App\Entity\ReservationSalle;
use App\Entity\User;
use App\Repository\UserRepository;
use Psr\Log\LoggerInterface;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;

/**
 * Prévient l’association et les agents compétents de la mairie qu’une réservation (salle ou
 * matériel) est annulée : notification dans l’application et e-mail.
 */
final class RequestCancellationNotifier
{
    public const BY_ASSOCIATION = 'association';
    public const BY_TOWN_HALL = 'mairie';

    /** Types lus par les cloches de notifications pour ouvrir le bon écran. */
    public const TYPE_ASSOCIATION = 'RESERVATION_CANCELLED';
    public const TYPE_AGENT = 'RESERVATION_CANCELLED_AGENT';

    public function __construct(
        private readonly MailerInterface $mailer,
        private readonly NotificationService $notificationService,
        private readonly UserRepository $userRepository,
        private readonly LoggerInterface $logger,
        #[Autowire(env: 'MAILER_FROM')] private readonly string $mailerFrom,
    ) {
    }

    /**
     * Crée les notifications (à enregistrer par l’appelant via flush) puis envoie les e-mails.
     */
    public function notify(ReservationSalle|ReservationMateriel $reservation, string $cancelledBy, ?string $reason = null): void
    {
        $association = $reservation->getAssociation();
        if (null === $association) {
            return;
        }

        $isRoom = $reservation instanceof ReservationSalle;
        $subject = $isRoom ? 'Réservation de salle annulée' : 'Réservation de matériel annulée';
        $details = $this->details($reservation);
        $summary = implode(' · ', array_values($details));
        if (null !== $reason && '' !== trim($reason)) {
            $summary .= ' Raison : '.trim($reason);
        }

        $associationIntro = self::BY_ASSOCIATION === $cancelledBy
            ? 'Votre association a annulé cette réservation. La mairie en a été informée.'
            : 'La mairie a annulé cette réservation de votre association.';
        foreach ($association->getUsers() as $user) {
            $this->notificationService->createForUser($user, $subject, $associationIntro.' '.$summary, self::TYPE_ASSOCIATION, $reservation->getId());
            $this->send($user, $subject, $associationIntro, $details, $reason, 'Retrouvez vos démarches depuis votre espace association.');
        }

        $agentIntro = self::BY_ASSOCIATION === $cancelledBy
            ? \sprintf('L’association « %s » a annulé sa réservation : le créneau est de nouveau disponible.', $association->getNom())
            : \sprintf('La réservation de l’association « %s » a été annulée par la mairie.', $association->getNom());
        $role = $isRoom ? 'ROLE_GESTION_SALLE' : 'ROLE_GESTION_MATERIEL';
        foreach ($this->userRepository->findMunicipalAgentsWithRole($role) as $agent) {
            $this->notificationService->createForUser($agent, $subject, $agentIntro.' '.$summary, self::TYPE_AGENT, $reservation->getId());
            $this->send($agent, $subject, $agentIntro, $details, $reason, 'Retrouvez les demandes depuis l’espace de gestion de la mairie.');
        }
    }

    /**
     * @return array<string, string>
     */
    private function details(ReservationSalle|ReservationMateriel $reservation): array
    {
        if ($reservation instanceof ReservationSalle) {
            return [
                'Salle' => (string) $reservation->getSalle()?->getNom(),
                'Créneau' => \sprintf(
                    'le %s de %s à %s',
                    $reservation->getDateDebut()?->format('d/m/Y'),
                    $reservation->getDateDebut()?->format('H\hi'),
                    $reservation->getDateFin()?->format('H\hi'),
                ),
                'Motif' => (string) $reservation->getMotifEvenement(),
            ];
        }

        return [
            'Retrait' => (string) $reservation->getDateRetrait()?->format('d/m/Y'),
            'Restitution' => (string) $reservation->getDateRestitution()?->format('d/m/Y'),
            'Motif' => (string) $reservation->getMotifEvenement(),
        ];
    }

    /**
     * @param array<string, string> $details
     */
    private function send(User $user, string $subject, string $intro, array $details, ?string $reason, string $footer): void
    {
        $email = $user->getEmail();
        if (null === $email || '' === trim($email)) {
            return;
        }

        try {
            $this->mailer->send(
                (new TemplatedEmail())
                    ->from(new Address($this->mailerFrom, 'Mairie de Feytiat'))
                    ->to($email)
                    ->subject($subject.' — Mairie de Feytiat')
                    ->htmlTemplate('emails/request_cancelled.html.twig')
                    ->context([
                        'title' => $subject,
                        'intro' => $intro,
                        'prenom' => $user->getPrenom(),
                        'details' => $details,
                        'reason' => null === $reason ? null : trim($reason),
                        'footer' => $footer,
                    ]),
            );
        } catch (\Throwable $exception) {
            // L’annulation reste enregistrée et visible dans l’application même si l’e-mail ne part pas.
            $this->logger->warning('E-mail d’annulation non envoyé.', ['exception' => $exception->getMessage()]);
        }
    }
}
