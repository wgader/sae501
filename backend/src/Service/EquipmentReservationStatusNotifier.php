<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\ReservationMateriel;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;

final class EquipmentReservationStatusNotifier
{
    public function __construct(
        private readonly MailerInterface $mailer,
        #[Autowire(env: 'MAILER_FROM')] private readonly string $mailerFrom,
    ) {
    }

    public function notifySubmitted(ReservationMateriel $reservation): void
    {
        $this->sendToAssociation(
            $reservation,
            'Votre demande de matériel a bien été reçue — Mairie de Feytiat',
            'emails/equipment_reservation_submitted.html.twig',
            [],
        );
    }

    public function notifyDecision(ReservationMateriel $reservation): void
    {
        $status = $reservation->getStatut();
        if (!in_array($status, ['Validée', 'Refusée'], true)) {
            return;
        }

        $this->sendToAssociation(
            $reservation,
            $status === 'Validée'
                ? 'Votre demande de matériel a été acceptée — Mairie de Feytiat'
                : 'Votre demande de matériel a été refusée — Mairie de Feytiat',
            $status === 'Validée'
                ? 'emails/equipment_reservation_validated.html.twig'
                : 'emails/equipment_reservation_refused.html.twig',
            $status === 'Refusée' ? ['noteInterne' => $reservation->getNoteInterne()] : [],
        );
    }

    /**
     * @param array<string, mixed> $extraContext
     */
    private function sendToAssociation(
        ReservationMateriel $reservation,
        string $subject,
        string $template,
        array $extraContext,
    ): void {
        $association = $reservation->getAssociation();
        if ($association === null) {
            return;
        }

        $context = array_merge([
            'reservation' => $reservation,
            'association' => $association,
            'lignes' => $reservation->getLignes(),
        ], $extraContext);

        foreach ($association->getUsers() as $user) {
            $email = $user->getEmail();
            if ($email === null || trim($email) === '') {
                continue;
            }

            $this->mailer->send(
                (new TemplatedEmail())
                    ->from(new Address($this->mailerFrom, 'Mairie de Feytiat'))
                    ->to($email)
                    ->subject($subject)
                    ->htmlTemplate($template)
                    ->context(array_merge([
                        'prenom' => $user->getPrenom(),
                        'nom' => $user->getNom(),
                    ], $context)),
            );
        }
    }
}