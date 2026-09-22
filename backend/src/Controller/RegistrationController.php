<?php

namespace App\Controller;

use App\Entity\Association;
use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\DependencyInjection\Attribute\Autowire; 
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

/**
 * Gère l'inscription des associations sur la plateforme.
 *
 * Routes :
 *   POST /api/auth/register/association → crée le compte + envoie le code email
 *   POST /api/auth/verify-email         → valide le code de vérification
 */
#[Route('/api/auth')]
class RegistrationController extends AbstractController
{
    /**
     * Inscription d'un représentant d'association.
     *
     * Flow :
     *   1. Rate limiting (5 tentatives / 15 min par IP)
     *   2. Validation des champs obligatoires
     *   3. Vérification email unique (message neutre — anti user enumeration)
     *   4. Création Association + User (isVerified = false, statut PENDING_VALIDATION)
     *   5. Génération code vérification 6 chiffres (expire 10 min)
     *   6. Envoi email avec le code
     *
     * Payload JSON attendu :
     * {
     *   "email": "contact@asso.fr",
     *   "password": "...",
     *   "nom": "Dupont",
     *   "prenom": "Jean",
     *   "telephone": "0612345678",
     *   "cguAccepted": true,
     *   "association": {
     *     "nom": "Foot Club Nord",
     *     "numeroRna": "W123456789",
     *     "numeroSiret": "12345678901234",
     *     "dateCreation": "2010-03-12",
     *     "nombreMembres": 47,
     *     "categorieActivite": "Sportive",
     *     "objet": "Promotion du football amateur dans le quartier nord.",
     *     "adresseSiegeSocial": "12 Rue des Lilas, 87220 Feytiat",
     *     "siteWeb": "https://footclubfnord.fr"
     *   }
     * }
     *
     * Réponses :
     *   201 → compte créé, email envoyé
     *   400 → JSON invalide ou champ manquant
     *   409 → email déjà utilisé (message neutre)
     *   422 → erreurs de validation Symfony
     *   429 → trop de tentatives (rate limiting)
     */
    #[Route('/register/association', name: 'api_register_association', methods: ['POST'])]
    public function registerAssociation(
        Request $request,
        EntityManagerInterface $em,
        UserPasswordHasherInterface $hasher,
        ValidatorInterface $validator,
        MailerInterface $mailer,
        UserRepository $userRepository,
        #[Autowire(service: 'limiter.register_association')]
        RateLimiterFactory $limiter,
    ): JsonResponse {
        // ── 1. Rate limiting ─────────────────────────────────────────────────────
        // 5 tentatives max par IP sur 15 minutes — protection anti-spam
        $rateLimiter = $limiter->create($request->getClientIp());
        if (!$rateLimiter->consume(1)->isAccepted()) {
            return $this->json(
                ['message' => 'Trop de tentatives. Réessayez dans 15 minutes.'],
                Response::HTTP_TOO_MANY_REQUESTS
            );
        }

        // ── 2. Décodage et vérification du payload ───────────────────────────────
        $data = json_decode($request->getContent(), true);

        if (!$data) {
            return $this->json(
                ['message' => 'Corps de la requête invalide ou JSON malformé.'],
                Response::HTTP_BAD_REQUEST
            );
        }

        // Vérification des champs obligatoires de premier niveau
        $requiredFields = ['email', 'password', 'nom', 'prenom', 'cguAccepted', 'association'];
        foreach ($requiredFields as $field) {
            if (empty($data[$field]) && $data[$field] !== false) {
                return $this->json(
                    ['errors' => [$field => 'Ce champ est obligatoire.']],
                    Response::HTTP_BAD_REQUEST
                );
            }
        }

        // Vérification des champs obligatoires de l'association
        $requiredAssocFields = [
            'nom', 'numeroRna', 'numeroSiret', 'dateCreation',
            'nombreMembres', 'categorieActivite', 'objet', 'adresseSiegeSocial',
        ];
        foreach ($requiredAssocFields as $field) {
            if (empty($data['association'][$field]) && $data['association'][$field] !== 0) {
                return $this->json(
                    ['errors' => ['association.' . $field => 'Ce champ est obligatoire.']],
                    Response::HTTP_BAD_REQUEST
                );
            }
        }

        // Vérification CGU obligatoirement acceptées
        if ($data['cguAccepted'] !== true) {
            return $this->json(
                ['errors' => ['cguAccepted' => 'Vous devez accepter les CGU.']],
                Response::HTTP_BAD_REQUEST
            );
        }

        // ── 3. Vérification unicité email ─────────────────────────────────────────
        // Message neutre pour éviter l'énumération d'utilisateurs (user enumeration attack)
        if ($userRepository->findOneBy(['email' => $data['email']])) {
            return $this->json(
                ['message' => 'Une erreur est survenue lors de la création du compte.'],
                Response::HTTP_CONFLICT
            );
        }

        // ── 4. Création de l'entité Association ──────────────────────────────────
        $association = new Association();
        $association->setNom($data['association']['nom']);
        $association->setNumeroRna($data['association']['numeroRna']);
        $association->setNumeroSiret($data['association']['numeroSiret']);
        $association->setNombreMembres((int) $data['association']['nombreMembres']);
        $association->setCategorieActivite($data['association']['categorieActivite']);
        $association->setObjet($data['association']['objet']);
        $association->setAdresseSiegeSocial($data['association']['adresseSiegeSocial']);
        $association->setSiteWeb($data['association']['siteWeb'] ?? '');

        // Conversion de la date de création (format attendu : YYYY-MM-DD)
        try {
            $association->setDateCreation(
                new \DateTimeImmutable($data['association']['dateCreation'])
            );
        } catch (\Exception) {
            return $this->json(
                ['errors' => ['association.dateCreation' => 'Format de date invalide. Utilisez YYYY-MM-DD.']],
                Response::HTTP_UNPROCESSABLE_ENTITY
            );
        }

        // ── 5. Création de l'entité User ──────────────────────────────────────────
        $user = new User();
        $user->setEmail($data['email']);
        $user->setNom($data['nom']);
        $user->setPrenom($data['prenom']);
        $user->setTelephone($data['telephone'] ?? null);
        $user->setTypeCompte('association');
        $user->setRoles(['ROLE_ASSOCIATION']);
        $user->setIsVerified(false);
        $user->setAssociation($association);
        $user->setCguValidateAt(new \DateTimeImmutable());

        // Hachage du mot de passe — Argon2id géré automatiquement par Symfony
        // Le mot de passe en clair n'est jamais stocké ni loggué
        $user->setPassword(
            $hasher->hashPassword($user, $data['password'])
        );

        // ── 6. Génération du code de vérification email ───────────────────────────
        // Code à 6 chiffres paddé à gauche, valable 10 minutes
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $user->setEmailVerificationCode($code);
        $user->setEmailVerificationCodeExpiresAt(new \DateTimeImmutable('+10 minutes'));

        // ── 7. Validation des entités via les contraintes Symfony ─────────────────
        $errorMessages = [];

        foreach ($validator->validate($user) as $error) {
            $errorMessages[$error->getPropertyPath()] = $error->getMessage();
        }

        foreach ($validator->validate($association) as $error) {
            $errorMessages['association.' . $error->getPropertyPath()] = $error->getMessage();
        }

        if (!empty($errorMessages)) {
            return $this->json(
                ['errors' => $errorMessages],
                Response::HTTP_UNPROCESSABLE_ENTITY
            );
        }

        // ── 8. Persistance en base ────────────────────────────────────────────────
        // Association d'abord — User a une FK vers Association
        $em->persist($association);
        $em->persist($user);
        $em->flush();

        // ── 9. Envoi du code de vérification par email ────────────────────────────
        $email = (new Email())
            ->from($_ENV['MAILER_FROM'])
            ->to($user->getEmail())
            ->subject('Vérification de votre adresse email — Feytiat Association')
            ->html(sprintf(
                '<h2>Bienvenue sur Feytiat Association</h2>
                <p>Bonjour %s,</p>
                <p>Votre code de vérification est :</p>
                <h1 style="letter-spacing: 8px; font-size: 36px; color: #2563eb;">%s</h1>
                <p>Ce code est valable <strong>10 minutes</strong>.</p>
                <p>Si vous n\'avez pas demandé ce code, ignorez cet email.</p>',
                htmlspecialchars($user->getPrenom()),
                $code
            ));

        $mailer->send($email);

        return $this->json([
            'message' => 'Compte créé avec succès. Vérifiez votre email pour confirmer votre adresse.',
            'userId' => $user->getId(),
        ], Response::HTTP_CREATED);
    }

    /**
     * Vérification du code email.
     *
     * Flow :
     *   1. Rate limiting (10 tentatives / 15 min par IP)
     *   2. Vérification des champs
     *   3. Recherche du user par email + code
     *   4. Vérification de l'expiration du code
     *   5. Activation du compte (isVerified = true, nettoyage du code)
     *
     * Payload JSON attendu :
     * {
     *   "email": "contact@asso.fr",
     *   "code": "482917"
     * }
     *
     * Réponses :
     *   200 → email vérifié, compte activé
     *   400 → champs manquants
     *   422 → code invalide ou expiré
     *   429 → trop de tentatives
     */
    #[Route('/verify-email', name: 'api_verify_email', methods: ['POST'])]
    public function verifyEmail(
        Request $request,
        EntityManagerInterface $em,
        UserRepository $userRepository,
        #[Autowire(service: 'limiter.verify_email')]
        RateLimiterFactory $limiter,
    ): JsonResponse {
        // ── 1. Rate limiting ─────────────────────────────────────────────────────
        // 5 tentatives max par IP sur 15 minutes
        $rateLimiter = $limiter->create($request->getClientIp());
        if (!$rateLimiter->consume(1)->isAccepted()) {
            return $this->json(
                ['message' => 'Trop de tentatives. Réessayez dans 15 minutes.'],
                Response::HTTP_TOO_MANY_REQUESTS
            );
        }

        // ── 2. Décodage du payload ───────────────────────────────────────────────
        $data = json_decode($request->getContent(), true);

        if (empty($data['email']) || empty($data['code'])) {
            return $this->json(
                ['message' => 'Email et code sont obligatoires.'],
                Response::HTTP_BAD_REQUEST
            );
        }

        // ── 3. Recherche du user par email + code ────────────────────────────────
        // Message neutre — ne pas confirmer si l'email existe ou non
        $user = $userRepository->findOneBy([
            'email' => $data['email'],
            'emailVerificationCode' => $data['code'],
        ]);

        if (!$user) {
            return $this->json(
                ['message' => 'Code invalide ou expiré.'],
                Response::HTTP_UNPROCESSABLE_ENTITY
            );
        }

        // ── 4. Vérification de l'expiration ──────────────────────────────────────
        if ($user->getEmailVerificationCodeExpiresAt() < new \DateTimeImmutable()) {
            return $this->json(
                ['message' => 'Code invalide ou expiré.'],
                Response::HTTP_UNPROCESSABLE_ENTITY
            );
        }

        // ── 5. Activation du compte ───────────────────────────────────────────────
        // Nettoyage du code — ne doit plus exister en base après validation
        $user->setIsVerified(true);
        $user->setEmailVerificationCode(null);
        $user->setEmailVerificationCodeExpiresAt(null);

        $em->flush();

        return $this->json([
            'message' => 'Email vérifié avec succès. Votre dossier est en attente de validation par la mairie.',
        ], Response::HTTP_OK);
    }
}