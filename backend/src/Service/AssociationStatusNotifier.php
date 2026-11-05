<?php

namespace App\Service;

use App\Entity\Association;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;

/**
 * Envoie les emails de notification lors d'un changement de statut d'une association.
 *
 * Statuts gérés :
 *   VALIDATED → génère un token d'activation (72h) + envoie l'email avec le lien
 *   REFUSED   → envoie un email de refus (pas de token)
 *
 * Les autres statuts (PENDING_VALIDATION, SUSPENDED) sont ignorés.
 */
final class AssociationStatusNotifier
{
    public function __construct(
        private readonly MailerInterface $mailer,
        private readonly EntityManagerInterface $entityManager,
        #[Autowire(env: 'MAILER_FROM')] private readonly string $mailerFrom,
        #[Autowire(env: 'FRONTEND_URL')] private readonly string $frontendUrl,
    ) {
    }

    /**
     * Point d'entrée principal — appelé par AssociationAdministrationController
     * après chaque changement de statut.
     */
    public function notify(Association $association, string $status): void
    {
        if (!in_array($status, ['VALIDATED', 'REFUSED'], true)) {
            return;
        }

        // Construit la liste des modules accordés à l'association
        $modules = self::buildModulesList($association);

        // Envoie un email à chaque utilisateur rattaché à l'association
        foreach ($association->getUsers() as $user) {
            if ($user->getEmail() === null) {
                continue;
            }

            if ($status === 'VALIDATED') {
                $this->sendValidatedEmail($association, $user, $modules);
            } else {
                $this->sendRefusedEmail($association, $user);
            }
        }
    }

    /**
     * Génère un token d'activation sécurisé (72h), le persiste,
     * puis envoie l'email de validation avec le lien d'activation.
     *
     * @param string[] $modules Liste des modules accordés (ex: ['Subventions', 'Matériel'])
     */
    private function sendValidatedEmail(Association $association, User $user, array $modules): void
    {
        // Token cryptographiquement sûr — 64 caractères hexadécimaux
        $token = bin2hex(random_bytes(32));
        $user->setActivationToken($token);
        $user->setActivationTokenExpiresAt(new \DateTimeImmutable('+72 hours'));
        $this->entityManager->flush();

        $this->mailer->send(
            (new TemplatedEmail())
                ->from(new Address($this->mailerFrom, 'Mairie de Feytiat'))
                ->to((string) $user->getEmail())
                ->subject('Votre inscription a été validée — Mairie de Feytiat')
                ->htmlTemplate('emails/association_validated.html.twig')
                ->context([
                    'prenom'         => $user->getPrenom(),
                    'nom'            => $user->getNom(),
                    'nomAssociation' => $association->getNom(),
                    'modules'        => $modules,
                    'activationUrl'  => $this->frontendUrl . '/activer-compte?token=' . $token . '&ref=' . base64_encode((string) $user->getEmail()),
                ]),
        );
    }

    /**
     * Envoie l'email de refus — pas de token, pas de lien d'activation.
     */
    private function sendRefusedEmail(Association $association, User $user): void
    {
        $this->mailer->send(
            (new TemplatedEmail())
                ->from(new Address($this->mailerFrom, 'Mairie de Feytiat'))
                ->to((string) $user->getEmail())
                ->subject('Votre inscription a été refusée — Mairie de Feytiat')
                ->htmlTemplate('emails/association_refused.html.twig')
                ->context([
                    'prenom'         => $user->getPrenom(),
                    'nom'            => $user->getNom(),
                    'nomAssociation' => $association->getNom(),
                ]),
        );
    }

    /**
     * Retourne la liste lisible des modules actifs de l'association.
     * Utilisé dans les templates email.
     *
     * @return string[]
     */
    public static function buildModulesList(Association $association): array
    {
        $modules = [];
        if ($association->isModuleSubventionActif()) {
            $modules[] = 'Subventions';
        }
        if ($association->isModuleMaterielActif()) {
            $modules[] = 'Matériel';
        }
        if ($association->isModuleSalleActif()) {
            $modules[] = 'Réservation de salles';
        }
        return $modules;
    }
}