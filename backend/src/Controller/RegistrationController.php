<?php

namespace App\Controller;

use App\Entity\Association;
use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use OpenApi\Attributes as OA;

/**
 * Gère l'inscription des associations sur la plateforme.
 *
 * Nouveau flow :
 *   1. L'asso remplit le formulaire (nom asso + contact président + CGU)
 *   2. On crée Association + User sans mot de passe
 *   3. On envoie un email de confirmation "demande reçue"
 *   4. La mairie valide → envoie le lien d'activation (ActivationController)
 *   5. L'asso clique le lien → définit son mot de passe → auto-login
 */
#[OA\Tag(name: 'Authentification')]
#[Route('/api/auth')]
class RegistrationController extends AbstractController
{
    /**
     * Inscription d'un représentant d'association.
     *
     * Payload JSON attendu :
     * {
     *   "nomAssociation": "Foot Club Nord",
     *   "nom": "Dupont",
     *   "prenom": "Jean",
     *   "email": "jean.dupont@example.fr",
     *   "telephone": "0612345678",   ← optionnel
     *   "cguAccepted": true
     * }
     *
     * Réponses :
     *   201 → demande soumise, email de confirmation envoyé
     *   400 → champ manquant ou CGU non acceptées
     *   409 → email déjà utilisé (message neutre — anti user enumeration)
     *   422 → erreur de validation Symfony
     *   429 → trop de tentatives (rate limiting)
     */
    #[OA\Post(
        path: '/api/auth/register/association',
        summary: 'Inscription d\'une association',
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(properties: [
                new OA\Property(property: 'nomAssociation', type: 'string', example: 'Foot Club Nord'),
                new OA\Property(property: 'nom', type: 'string', example: 'Dupont'),
                new OA\Property(property: 'prenom', type: 'string', example: 'Jean'),
                new OA\Property(property: 'email', type: 'string', format: 'email', example: 'jean@example.fr'),
                new OA\Property(property: 'telephone', type: 'string', example: '0612345678'),
                new OA\Property(property: 'cguAccepted', type: 'boolean', example: true),
            ])
        ),
        responses: [
            new OA\Response(response: 201, description: 'Demande soumise, email envoyé'),
            new OA\Response(response: 400, description: 'Champ manquant ou CGU non acceptées'),
            new OA\Response(response: 409, description: 'Email déjà utilisé'),
            new OA\Response(response: 422, description: 'Erreur de validation'),
            new OA\Response(response: 429, description: 'Trop de tentatives'),
        ]
    )]
    #[Route('/register/association', name: 'api_register_association', methods: ['POST'])]
    public function registerAssociation(
        Request $request,
        EntityManagerInterface $em,
        ValidatorInterface $validator,
        MailerInterface $mailer,
        UserRepository $userRepository,
        #[Autowire(service: 'limiter.register_association')]
        RateLimiterFactory $limiter,
    ): JsonResponse {
        // ── Rate limiting ─────────────────────────────────────────────────────
        // 5 tentatives max par IP sur 15 minutes — protection anti-spam
        $rateLimiter = $limiter->create($request->getClientIp());
        if (!$rateLimiter->consume(1)->isAccepted()) {
            return $this->json(
                ['message' => 'Trop de tentatives. Réessayez dans 15 minutes.'],
                Response::HTTP_TOO_MANY_REQUESTS
            );
        }

        // ── Décodage du payload ───────────────────────────────────────────────
        $data = json_decode($request->getContent(), true);

        if (!$data) {
            return $this->json(
                ['message' => 'Corps de la requête invalide ou JSON malformé.'],
                Response::HTTP_BAD_REQUEST
            );
        }

        // ── Vérification des champs obligatoires ──────────────────────────────
        $required = ['nomAssociation', 'nom', 'prenom', 'email', 'cguAccepted'];
        foreach ($required as $field) {
            if (!array_key_exists($field, $data) || ($data[$field] === '' || $data[$field] === null)) {
                return $this->json(
                    ['errors' => [$field => 'Ce champ est obligatoire.']],
                    Response::HTTP_BAD_REQUEST
                );
            }
        }

        // ── CGU obligatoirement acceptées ─────────────────────────────────────
        if ($data['cguAccepted'] !== true) {
            return $this->json(
                ['errors' => ['cguAccepted' => 'Vous devez accepter les CGU.']],
                Response::HTTP_BAD_REQUEST
            );
        }

        // ── Vérification unicité email ────────────────────────────────────────
        // Message neutre pour éviter l'énumération d'utilisateurs (user enumeration attack)
        if ($userRepository->findOneBy(['email' => $data['email']])) {
            return $this->json(
                ['message' => 'Une erreur est survenue lors de la création du compte.'],
                Response::HTTP_CONFLICT
            );
        }

        // ── Création de l'Association ─────────────────────────────────────────
        // Seul le nom est requis à l'inscription — le reste sera complété plus tard
        $association = new Association();
        $association->setNom($data['nomAssociation']);

        // ── Création du User (sans mot de passe) ──────────────────────────────
        // Le mot de passe sera défini lors de l'activation du compte
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

        // ── Validation des entités via les contraintes Symfony ────────────────
        $errors = [];
        foreach ($validator->validate($user) as $error) {
            $errors[$error->getPropertyPath()] = $error->getMessage();
        }
        foreach ($validator->validate($association) as $error) {
            $errors['association.' . $error->getPropertyPath()] = $error->getMessage();
        }

        if (!empty($errors)) {
            return $this->json(
                ['errors' => $errors],
                Response::HTTP_UNPROCESSABLE_ENTITY
            );
        }

        // ── Persistance en base ───────────────────────────────────────────────
        // Association d'abord — User a une FK vers Association
        $em->persist($association);
        $em->persist($user);
        $em->flush();

        // ── Email de confirmation "demande reçue" ─────────────────────────────
        $email = (new TemplatedEmail())
            ->from($_ENV['MAILER_FROM'])
            ->to($user->getEmail())
            ->subject('Votre demande d\'inscription a bien été reçue')
            ->htmlTemplate('emails/registration_confirmation.html.twig')
            ->context([
                'prenom' => $user->getPrenom(),
                'nom' => $user->getNom(),
                'nomAssociation' => $association->getNom(),
                'emailContact' => $user->getEmail(),
            ]);

        $mailer->send($email);

        return $this->json(
            ['message' => 'Votre demande a bien été soumise. Vous recevrez un email de confirmation.'],
            Response::HTTP_CREATED
        );
    }
}