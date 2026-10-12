<?php

namespace App\Service;

use App\Entity\Association;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;

final class AssociationStatusNotifier
{
    public function __construct(private readonly MailerInterface $mailer)
    {
    }

    public function notify(Association $association, string $status): void
    {
        if (!in_array($status, ['VALIDATED', 'REFUSED'], true)) {
            return;
        }

        foreach ($association->getUsers() as $user) {
            $emailAddress = $user->getEmail();
            if ($emailAddress === null) {
                continue;
            }

            $name = htmlspecialchars((string) $user->getPrenom(), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
            $associationName = htmlspecialchars((string) $association->getNom(), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

            if ($status === 'VALIDATED') {
                $subject = 'Votre inscription a été validée — SAE501';
                $html = sprintf(
                    '<h2>Félicitations %s,</h2><p>Le compte de votre association <strong>%s</strong> a été validé par la mairie.</p><p>Vous pouvez dès à présent vous connecter pour accéder à vos services.</p>',
                    $name,
                    $associationName,
                );
            } else {
                $subject = 'Votre inscription a été refusée — SAE501';
                $html = sprintf(
                    '<h2>Bonjour %s,</h2><p>Nous sommes au regret de vous informer que le compte de votre association <strong>%s</strong> a été refusé par la mairie.</p><p>Pour plus d’informations, vous pouvez contacter nos services.</p>',
                    $name,
                    $associationName,
                );
            }

            $this->mailer->send(
                (new Email())
                    ->from($_ENV['MAILER_FROM'] ?? 'noreply@sae501.fr')
                    ->to($emailAddress)
                    ->subject($subject)
                    ->html($html),
            );
        }
    }
}
