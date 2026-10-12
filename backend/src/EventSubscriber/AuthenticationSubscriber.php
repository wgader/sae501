<?php

namespace App\EventSubscriber;

use App\Entity\User;
use Lexik\Bundle\JWTAuthenticationBundle\Event\AuthenticationSuccessEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Event\AuthenticationFailureEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Events;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

/**
 * Intercepte les événements d'authentification JWT.
 *
 * - AuthenticationSuccess : enrichit la réponse JWT avec les infos du user
 * - AuthenticationFailure : personnalise le message d'erreur
 */
class AuthenticationSubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [
            Events::AUTHENTICATION_SUCCESS => 'onAuthenticationSuccess',
            Events::AUTHENTICATION_FAILURE => 'onAuthenticationFailure',
        ];
    }

    /**
     * Déclenché après un login réussi.
     *
     * Vérifie que le compte est bien vérifié avant de retourner le token.
     * Enrichit la réponse avec les infos du user (id, email, rôles, typeCompte).
     */
    public function onAuthenticationSuccess(AuthenticationSuccessEvent $event): void
    {
        $user = $event->getUser();

        if (!$user instanceof User) {
            return;
        }

        // Compte non activé (pas encore de mot de passe défini)
        if (!$user->isVerified()) {
            $event->setData([
                'error' => true,
                'message' => 'Votre compte n\'est pas encore activé.',
            ]);
            return;
        }

        // Compte suspendu
        if ($user->getInactivatedAt() !== null) {
            $event->setData([
                'error' => true,
                'message' => 'Votre compte a été suspendu. Contactez la mairie.',
            ]);
            return;
        }

        $event->setData(array_merge($event->getData(), [
            'user' => [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'nom' => $user->getNom(),
                'prenom' => $user->getPrenom(),
                'roles' => $user->getRoles(),
                'typeCompte' => $user->getTypeCompte(),
                'isVerified' => $user->isVerified(),
            ],
        ]));
    }

    /**
     * Déclenché après un échec de login.
     * Retourne un message d'erreur neutre pour éviter l'énumération.
     */
    public function onAuthenticationFailure(AuthenticationFailureEvent $event): void
    {
        $event->setResponse(new JsonResponse(
            ['message' => 'Identifiants incorrects.'],
            Response::HTTP_UNAUTHORIZED
        ));
    }
}