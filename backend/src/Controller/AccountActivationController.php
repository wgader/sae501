<?php

namespace App\Controller;

use App\Repository\UserRepository;
use App\Service\AssociationStatusNotifier;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\Validator\ValidatorInterface;

/**
 * Gère l'activation de compte et le renvoi du lien d'activation.
 *
 * Routes publiques (pas de JWT requis) :
 *   POST /api/auth/activate          → définit le mot de passe + auto-login
 *   POST /api/auth/resend-activation → renvoie un email d'activation
 */
#[Route('/api/auth')]
final class AccountActivationController extends AbstractController
{
    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly EntityManagerInterface $entityManager,
        private readonly MailerInterface $mailer,
        private readonly UserPasswordHasherInterface $passwordHasher,
        #[Autowire(env: 'MAILER_FROM')] private readonly string $mailerFrom,
        #[Autowire(env: 'FRONTEND_URL')] private readonly string $frontendUrl,
    ) {
    }

    /**
     * Active le compte en définissant le mot de passe via le token reçu par email.
     *
     * Payload JSON attendu :
     * { "token": "...", "password": "MonMdp123!" }
     *
     * Réponses :
     *   200 → compte activé, JWT retourné (auto-login)
     *   400 → payload invalide
     *   401 → token invalide ou expiré
     *   422 → mot de passe trop faible
     */
    #[Route('/activate', name: 'api_activate_account', methods: ['POST'])]
    public function activate(
        Request $request,
        JWTTokenManagerInterface $jwtManager,
        ValidatorInterface $validator,
    ): JsonResponse {
        // ── Décodage du payload ───────────────────────────────────────────────
        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            return $this->json(['message' => 'Corps de la requête invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $token = $data['token'] ?? null;
        $password = $data['password'] ?? null;

        if (!is_string($token) || !is_string($password) || $token === '' || $password === '') {
            return $this->json(['message' => 'Les champs "token" et "password" sont requis.'], Response::HTTP_BAD_REQUEST);
        }

        // ── Recherche du user par token ───────────────────────────────────────
        $user = $this->userRepository->findOneBy(['activationToken' => $token]);

        // Token inconnu ou expiré → même message (anti-énumération)
        if ($user === null || $user->getActivationTokenExpiresAt() < new \DateTimeImmutable()) {
            return $this->json(
                ['message' => 'Ce lien d\'activation est invalide ou a expiré.'],
                Response::HTTP_UNAUTHORIZED
            );
        }

        // ── Validation du mot de passe ────────────────────────────────────────
        // Minimum 8 caractères, au moins une majuscule, une minuscule, un chiffre
        $violations = $validator->validate($password, [
            new Assert\NotBlank(),
            new Assert\Length(min: 8, minMessage: 'Le mot de passe doit contenir au moins 8 caractères.'),
            new Assert\Regex(
                pattern: '/[A-Z]/',
                message: 'Le mot de passe doit contenir au moins une majuscule.'
            ),
            new Assert\Regex(
                pattern: '/[a-z]/',
                message: 'Le mot de passe doit contenir au moins une minuscule.'
            ),
            new Assert\Regex(
                pattern: '/[0-9]/',
                message: 'Le mot de passe doit contenir au moins un chiffre.'
            ),
        ]);

        if (count($violations) > 0) {
            $errors = [];
            foreach ($violations as $violation) {
                $errors[] = $violation->getMessage();
            }
            return $this->json(['errors' => $errors], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // ── Activation du compte ──────────────────────────────────────────────
        $user->setPassword($this->passwordHasher->hashPassword($user, $password));
        $user->setIsVerified(true);
        // Invalide le token — ne peut plus être réutilisé
        $user->setActivationToken(null);
        $user->setActivationTokenExpiresAt(null);

        $this->entityManager->flush();

        $this->mailer->send(
            (new TemplatedEmail())
                ->from(new Address($this->mailerFrom, 'Mairie de Feytiat'))
                ->to((string) $user->getEmail())
                ->subject('Votre compte est activé — Mairie de Feytiat')
                ->htmlTemplate('emails/account_activated.html.twig')
                ->context([
                    'prenom' => $user->getPrenom(),
                    'nom' => $user->getNom(),
                    'nomAssociation' => $user->getAssociation()?->getNom() ?? '',
                    'loginUrl' => $this->frontendUrl . '/connexion',
                ])
        );

        // ── Auto-login : génération du JWT ────────────────────────────────────
        $jwt = $jwtManager->create($user);

        return $this->json([
            'message' => 'Votre compte a été activé avec succès.',
            'token' => $jwt,
        ]);
    }

    /**
     * Renvoie un email d'activation si le token a expiré.
     *
     * Payload JSON attendu :
     * { "email": "jean.dupont@example.fr" }
     *
     * Réponse : toujours 200 (anti-énumération).
     */
    #[Route('/resend-activation', name: 'api_resend_activation', methods: ['POST'])]
    public function resendActivation(Request $request): JsonResponse
    {
        $genericResponse = $this->json(
            ['message' => 'Si un compte en attente d\'activation existe pour cet email, un nouveau lien vous a été envoyé.'],
            Response::HTTP_OK
        );

        $data = json_decode($request->getContent(), true);
        if (!is_array($data) || empty($data['email']) || !is_string($data['email'])) {
            return $genericResponse;
        }

        $user = $this->userRepository->findOneBy(['email' => trim($data['email'])]);

        if (
            $user === null
            || $user->isVerified()
            || $user->getTypeCompte() !== 'association'
            || $user->isDeleted()
            || $user->getAssociation() === null
            || $user->getAssociation()->getStatut() !== 'VALIDATED'
        ) {
            return $genericResponse;
        }

        // Rate limiting : token émis il y a moins d'1h → pas de renvoi
        $expiresAt = $user->getActivationTokenExpiresAt();
        if ($expiresAt !== null && $expiresAt > new \DateTimeImmutable('+71 hours')) {
            return $genericResponse;
        }

        // Nouveau token
        $token = bin2hex(random_bytes(32));
        $user->setActivationToken($token);
        $user->setActivationTokenExpiresAt(new \DateTimeImmutable('+72 hours'));
        $this->entityManager->flush();

        $association = $user->getAssociation();
        $modules = AssociationStatusNotifier::buildModulesList($association);

        $this->mailer->send(
            (new TemplatedEmail())
                ->from(new Address($this->mailerFrom, 'Mairie de Feytiat'))
                ->to((string) $user->getEmail())
                ->subject('Activez votre compte — Mairie de Feytiat')
                ->htmlTemplate('emails/association_validated.html.twig')
                ->context([
                    'prenom' => $user->getPrenom(),
                    'nom' => $user->getNom(),
                    'nomAssociation' => $association->getNom(),
                    'modules' => $modules,
                    'activationUrl' => $this->frontendUrl . '/activer-compte?token=' . $token . '&ref=' . base64_encode((string) $user->getEmail()),
                ])
        );

        return $genericResponse;
    }
}