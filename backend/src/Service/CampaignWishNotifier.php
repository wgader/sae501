<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\CampaignWishSubmission;
use App\Repository\CampaignWishSubmissionRepository;
use Psr\Log\LoggerInterface;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;

/**
 * Accusé de réception d'un dossier de vœux, avec le récapitulatif de tous les créneaux demandés.
 */
final class CampaignWishNotifier
{
    public function __construct(
        private readonly CampaignWishSubmissionRepository $submissions,
        private readonly MailerInterface $mailer,
        private readonly LoggerInterface $logger,
        #[Autowire(env: 'MAILER_FROM')] private readonly string $mailerFrom,
    ) {
    }

    public function notifySubmitted(int $submissionId): void
    {
        $submission = $this->submissions->find($submissionId);
        $association = $submission?->getAssociation();
        if (!$submission instanceof CampaignWishSubmission || null === $association) {
            return;
        }

        $wishes = array_map(CampaignWishService::serializeWish(...), $submission->getWishes()->toArray());
        foreach ($association->getUsers() as $user) {
            $email = $user->getEmail();
            if (null === $email || '' === trim($email)) {
                continue;
            }

            try {
                $this->mailer->send(
                    (new TemplatedEmail())
                        ->from(new Address($this->mailerFrom, 'Mairie de Feytiat'))
                        ->to($email)
                        ->subject('Vos vœux de créneaux ont bien été reçus — Mairie de Feytiat')
                        ->htmlTemplate('emails/campaign_wishes_submitted.html.twig')
                        ->context([
                            'prenom' => $user->getPrenom(),
                            'association' => $association,
                            'campaign' => $submission->getCampaign(),
                            'wishes' => $wishes,
                        ]),
                );
            } catch (TransportExceptionInterface $exception) {
                $this->logger->error('Envoi de l’accusé de réception des vœux impossible.', [
                    'submission' => $submissionId,
                    'exception' => $exception->getMessage(),
                ]);
            }
        }
    }
}
