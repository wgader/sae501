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

        // Bloquer les comptes non vérifiés
        if (!$user->isVerified()) {
            $event->setData([]);
            $response = new JsonResponse(
                ['message' => 'Votre email n\'est pas encore vérifié. Vérifiez votre boîte mail.'],
                Response::HTTP_FORBIDDEN
            );
            // On ne peut pas changer la réponse directement ici
            // On passe les données vides — le front gèrera le 200 avec data vide
            $event->setData([
                'error' => true,
                'message' => 'Votre email n\'est pas encore vérifié. Vérifiez votre boîte mail.',
            ]);
            return;
        }

        // Bloquer les comptes inactivés
        if ($user->getInactivatedAt() !== null) {
            $event->setData([
                'error' => true,
                'message' => 'Votre compte a été suspendu. Contactez la mairie.',
            ]);
            return;
        }

        // Enrichir la réponse avec les infos du user
        $event->setData(array_merge($event->getData(), [
            'user' => [
                'id'          => $user->getId(),
                'email'       => $user->getEmail(),
                'nom'         => $user->getNom(),
                'prenom'      => $user->getPrenom(),
                'roles'       => $user->getRoles(),
                'typeCompte'  => $user->getTypeCompte(),
                'isVerified'  => $user->isVerified(),
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