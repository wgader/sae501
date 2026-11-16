<?php

declare(strict_types=1);

namespace App\Security;

use App\Entity\User;
use Lexik\Bundle\JWTAuthenticationBundle\Security\Http\Cookie\JWTCookieProvider;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\Response;

/**
 * Session du navigateur : le JWT voyage dans un cookie HttpOnly (illisible par JavaScript),
 * jamais dans le corps des réponses. Le corps ne contient que le profil affiché par le frontend.
 */
final class SessionCookie
{
    public const NAME = 'sae501_session';

    public function __construct(
        #[Autowire(service: 'lexik_jwt_authentication.cookie_provider.sae501_session')]
        private readonly JWTCookieProvider $cookieProvider,
        private readonly JWTTokenManagerInterface $jwtManager,
        #[Autowire('%env(bool:JWT_COOKIE_SECURE)%')]
        private readonly bool $secure,
    ) {
    }

    /**
     * @template T of Response
     *
     * @param T $response
     *
     * @return T
     */
    public function open(Response $response, User $user): Response
    {
        $response->headers->setCookie($this->cookieProvider->createCookie($this->jwtManager->create($user)));

        return $response;
    }

    /**
     * @template T of Response
     *
     * @param T $response
     *
     * @return T
     */
    public function close(Response $response): Response
    {
        $response->headers->clearCookie(self::NAME, '/', null, $this->secure, true, 'strict');

        return $response;
    }

    /**
     * Profil non sensible conservé par le frontend pour l’affichage (noms, rôles, modules).
     *
     * @return array<string, mixed>
     */
    public static function profile(User $user): array
    {
        $association = $user->getAssociation();

        return [
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'nom' => $user->getNom(),
            'prenom' => $user->getPrenom(),
            'roles' => $user->getRoles(),
            'typeCompte' => $user->getTypeCompte(),
            'isVerified' => $user->isVerified(),
            'nomAssociation' => $association?->getNom(),
            'modules' => null === $association ? null : [
                'subventions' => $association->isModuleSubventionActif(),
                'materiel' => $association->isModuleMaterielActif(),
                'salles' => $association->isModuleSalleActif(),
                'evenements' => $association->isModuleEvenementActif(),
            ],
        ];
    }
}
