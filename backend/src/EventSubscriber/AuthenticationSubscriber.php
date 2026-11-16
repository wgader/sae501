<?php

namespace App\EventSubscriber;

use App\Entity\User;
use App\Security\SessionCookie;
use Lexik\Bundle\JWTAuthenticationBundle\Event\AuthenticationSuccessEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Event\AuthenticationFailureEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTCreatedEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Events;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAccountStatusException;
use Symfony\Component\Security\Core\Exception\TooManyLoginAttemptsAuthenticationException;

/**
 * Intercepte les événements d'authentification JWT.
 *
 * - AuthenticationSuccess : enrichit la réponse JWT avec les infos du user
 * - AuthenticationFailure : personnalise le message d'erreur
 * - JWTCreated : enrichit le payload du token JWT
 */
class AuthenticationSubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [
            Events::AUTHENTICATION_SUCCESS => 'onAuthenticationSuccess',
            Events::AUTHENTICATION_FAILURE => 'onAuthenticationFailure',
            Events::JWT_CREATED => 'onJWTCreated',
        ];
    }

    /**
     * Déclenché après un login réussi.
     *
     * Enrichit la réponse avec les infos du user (id, email, rôles, typeCompte) ; le JWT lui-même
     * part dans le cookie HttpOnly et n’apparaît pas dans le corps.
     */
    public function onAuthenticationSuccess(AuthenticationSuccessEvent $event): void
    {
        $user = $event->getUser();

        if (!$user instanceof User) {
            return;
        }

        // Comptes non activés, suspendus ou supprimés : refusés avant ce point par AccountStatusChecker.
        $event->setData(array_merge($event->getData(), ['user' => SessionCookie::profile($user)]));
    }

    /**
     * Enrichit le payload du JWT avec le nom de l'association et l'identité du user.
     */
    public function onJWTCreated(JWTCreatedEvent $event): void
    {
        $user = $event->getUser();

        if ($user instanceof User) {
            $payload = $event->getData();
            $association = $user->getAssociation();
            if ($association) {
                $payload['nomAssociation'] = $association->getNom();
                $payload['moduleSalleActif'] = $association->isModuleSalleActif();
                $payload['moduleMaterielActif'] = $association->isModuleMaterielActif();
                $payload['moduleSubventionActif'] = $association->isModuleSubventionActif();
            }
            $payload['prenom'] = $user->getPrenom();
            $payload['nom'] = $user->getNom();
            $event->setData($payload);
        }
    }

    /**
     * Déclenché après un échec de login.
     * Retourne un message d'erreur neutre pour éviter l'énumération.
     */
    public function onAuthenticationFailure(AuthenticationFailureEvent $event): void
    {
        // Trop d’échecs récents (login_throttling) : 429 explicite plutôt que « identifiants incorrects ».
        if ($event->getException() instanceof TooManyLoginAttemptsAuthenticationException) {
            $event->setResponse(new JsonResponse(
                ['message' => 'Trop de tentatives de connexion. Réessayez dans 15 minutes.'],
                Response::HTTP_TOO_MANY_REQUESTS,
                ['Retry-After' => '900'],
            ));

            return;
        }

        // Mot de passe correct mais compte non activé ou suspendu : le motif peut être donné.
        $exception = $event->getException();
        if ($exception instanceof CustomUserMessageAccountStatusException) {
            $event->setResponse(new JsonResponse(['message' => $exception->getMessageKey()], Response::HTTP_FORBIDDEN));

            return;
        }

        $event->setResponse(new JsonResponse(
            ['message' => 'Identifiants incorrects.'],
            Response::HTTP_UNAUTHORIZED
        ));
    }
}