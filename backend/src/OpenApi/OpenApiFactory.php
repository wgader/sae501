<?php

namespace App\OpenApi;

use ApiPlatform\OpenApi\Factory\OpenApiFactoryInterface;
use ApiPlatform\OpenApi\Model;
use ApiPlatform\OpenApi\OpenApi;

final class OpenApiFactory implements OpenApiFactoryInterface
{
    public function __construct(private readonly OpenApiFactoryInterface $decorated) {}

    public function __invoke(array $context = []): OpenApi
    {
        $openApi = ($this->decorated)($context);
        $paths  = $openApi->getPaths();

        $paths->addPath('/api/auth/register/association', new Model\PathItem(
            post: new Model\Operation(
                operationId: 'registerAssociation',
                tags: ['Authentification'],
                summary: "Inscription d'une association",
                requestBody: new Model\RequestBody(content: new \ArrayObject([
                    'application/json' => new Model\MediaType(schema: new \ArrayObject([
                        'type' => 'object',
                        'required' => ['nomAssociation', 'nom', 'prenom', 'email', 'cguAccepted'],
                        'properties' => [
                            'nomAssociation' => ['type' => 'string', 'example' => 'Foot Club Nord'],
                            'nom'            => ['type' => 'string', 'example' => 'Dupont'],
                            'prenom'         => ['type' => 'string', 'example' => 'Jean'],
                            'email'          => ['type' => 'string', 'format' => 'email'],
                            'telephone'      => ['type' => 'string', 'example' => '0612345678'],
                            'cguAccepted'    => ['type' => 'boolean'],
                        ],
                    ])),
                ])),
                responses: [
                    '201' => new Model\Response('Demande soumise, email envoyé'),
                    '400' => new Model\Response('Champ manquant ou CGU non acceptées'),
                    '409' => new Model\Response('Email déjà utilisé'),
                    '422' => new Model\Response('Erreur de validation'),
                    '429' => new Model\Response('Trop de tentatives'),
                ]
            )
        ));

        $paths->addPath('/api/auth/activate', new Model\PathItem(
            post: new Model\Operation(
                operationId: 'activateAccount',
                tags: ['Authentification'],
                summary: 'Activation du compte et définition du mot de passe',
                requestBody: new Model\RequestBody(content: new \ArrayObject([
                    'application/json' => new Model\MediaType(schema: new \ArrayObject([
                        'type' => 'object',
                        'required' => ['token', 'password'],
                        'properties' => [
                            'token'    => ['type' => 'string'],
                            'password' => ['type' => 'string', 'example' => 'MonMdp123!'],
                        ],
                    ])),
                ])),
                responses: [
                    '200' => new Model\Response('Compte activé, JWT retourné'),
                    '400' => new Model\Response('Payload invalide'),
                    '401' => new Model\Response('Token invalide ou expiré'),
                    '422' => new Model\Response('Mot de passe trop faible'),
                ]
            )
        ));

        $paths->addPath('/api/auth/resend-activation', new Model\PathItem(
            post: new Model\Operation(
                operationId: 'resendActivation',
                tags: ['Authentification'],
                summary: "Renvoi du lien d'activation (réponse toujours 200)",
                requestBody: new Model\RequestBody(content: new \ArrayObject([
                    'application/json' => new Model\MediaType(schema: new \ArrayObject([
                        'type' => 'object',
                        'properties' => [
                            'email' => ['type' => 'string', 'format' => 'email'],
                        ],
                    ])),
                ])),
                responses: [
                    '200' => new Model\Response('Réponse générique anti-énumération'),
                ]
            )
        ));

        $paths->addPath('/api/admin/associations', new Model\PathItem(
            get: new Model\Operation(
                operationId: 'adminListAssociations',
                tags: ['Administration'],
                summary: 'Liste paginée des associations',
                security: [['bearerAuth' => []]],
                parameters: [
                    new Model\Parameter('page', 'query', 'Numéro de page', schema: ['type' => 'integer', 'default' => 1]),
                    new Model\Parameter('itemsPerPage', 'query', 'Éléments par page', schema: ['type' => 'integer', 'default' => 10]),
                    new Model\Parameter('status', 'query', 'Filtrer par statut', schema: ['type' => 'string', 'enum' => ['PENDING_VALIDATION', 'VALIDATED', 'REFUSED', 'SUSPENDED']]),
                ],
                responses: [
                    '200' => new Model\Response('Liste des associations'),
                    '400' => new Model\Response('Statut invalide'),
                    '403' => new Model\Response('Accès refusé'),
                ]
            )
        ));

        $paths->addPath('/api/admin/associations/{id}/status', new Model\PathItem(
            patch: new Model\Operation(
                operationId: 'adminUpdateAssociationStatus',
                tags: ['Administration'],
                summary: "Modifier le statut et les permissions d'une association",
                security: [['bearerAuth' => []]],
                parameters: [
                    new Model\Parameter('id', 'path', "ID de l'association", required: true, schema: ['type' => 'integer']),
                ],
                requestBody: new Model\RequestBody(content: new \ArrayObject([
                    'application/json' => new Model\MediaType(schema: new \ArrayObject([
                        'type' => 'object',
                        'properties' => [
                            'status'      => ['type' => 'string', 'enum' => ['PENDING_VALIDATION', 'VALIDATED', 'REFUSED', 'SUSPENDED']],
                            'permissions' => ['type' => 'array', 'items' => ['type' => 'string', 'enum' => ['subventions', 'materiel', 'salles']]],
                        ],
                    ])),
                ])),
                responses: [
                    '200' => new Model\Response('Association mise à jour'),
                    '400' => new Model\Response('Payload invalide'),
                    '403' => new Model\Response('Accès refusé'),
                    '422' => new Model\Response('Statut ou module invalide'),
                ]
            )
        ));

        return $openApi;
    }
}