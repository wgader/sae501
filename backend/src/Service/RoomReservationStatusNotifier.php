<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\ReservationSalle;
use App\Entity\User;
use App\Repository\ReservationSalleRepository;
use App\Repository\UserRepository;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;

final class RoomReservationStatusNotifier
{
    public function __construct(
        private readonly MailerInterface $mailer,
        private readonly ReservationSalleRepository $reservationSalleRepository,
        private readonly UserRepository $userRepository,
        #[Autowire(env: 'MAILER_FROM')] private readonly string $mailerFrom,
    ) {
    }

    public function notifySubmitted(int $reservationSalleId): void
    {
        $reservation = $this->reservationSalleRepository->find($reservationSalleId);
        if ($reservation === null) {
            return;
        }

        $association = $reservation->getAssociation();
        $salle = $reservation->getSalle();
        if ($association === null || $salle === null) {
            return;
        }

        $context = [
            'reservation' => $reservation,
            'association' => $association,
            'salle' => $salle,
        ];

        // 1. Envoi de l'accusé de réception à l'association
        foreach ($association->getUsers() as $user) {
            $email = $user->getEmail();
            if ($email === null || trim($email) === '') {
                continue;
            }

            try {
                $this->mailer->send(
                    (new TemplatedEmail())
                        ->from(new Address($this->mailerFrom, 'Mairie de Feytiat'))
                        ->to($email)
                        ->subject('Accusé de réception : Demande de réservation de salle — Mairie de Feytiat')
                        ->htmlTemplate('emails/room_reservation_submitted_association.html.twig')
                        ->context(array_merge([
                            'prenom' => $user->getPrenom(),
                            'nom' => $user->getNom(),
                        ], $context)),
                );
            } catch (\Throwable) {
                // Évite de bloquer en cas de problème ponctuel de transport SMTP
            }
        }

        // 2. Notification aux agents municipaux compétents (ROLE_GESTION_SALLE ou ROLE_ADMIN)
        $agents = $this->userRepository->findMunicipalAgentsForRooms();
        foreach ($agents as $agent) {
            $email = $agent->getEmail();
            if ($email === null || trim($email) === '') {
                continue;
            }

            try {
                $this->mailer->send(
                    (new TemplatedEmail())
                        ->from(new Address($this->mailerFrom, 'Mairie de Feytiat'))
                        ->to($email)
                        ->subject('Nouvelle demande de réservation de salle municipale — Feytiat')
                        ->htmlTemplate('emails/room_reservation_submitted_agent.html.twig')
                        ->context(array_merge([
                            'agentPrenom' => $agent->getPrenom(),
                            'agentNom' => $agent->getNom(),
                        ], $context)),
                );
            } catch (\Throwable) {
                // Évite de bloquer en cas de problème ponctuel de transport SMTP
            }
        }
    }
}

