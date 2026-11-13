# Consignes backend — SAE501

## Stack et architecture

Le backend est une API REST Symfony 8.1 servie par FrankenPHP dans Docker.

- **PHP** : 8.4 ou supérieur.
- **API** : API Platform 4.3 pour exposer les ressources et documenter les endpoints.
- **Persistance** : Doctrine ORM 3.7 avec MySQL 8.4.
- **Authentification** : JWT via LexikJWTAuthenticationBundle.
- **Validation et sérialisation** : composants Symfony Validator et Serializer.
- **Asynchrone et notifications** : composants Symfony Messenger et Mailer lorsque le besoin le justifie.
- **Tests** : PHPUnit, avec tests HTTP fonctionnels pour les endpoints.

L'API est consommée par le frontend Next.js situé dans `../frontend`. Ne pas ajouter
de nouvelle interface serveur ou d'ODM : les fonctionnalités métier doivent rester
accessibles via l'API REST et s'appuyer sur Doctrine ORM.

## Structure du projet

- `src/Entity/` : entités Doctrine et règles de validation associées.
- `src/ApiResource/` : ressources et opérations API Platform.
- `src/Controller/` : contrôleurs HTTP spécifiques, fins et centrés sur l'orchestration.
- `src/Service/` : logique métier réutilisable et traitements complexes.
- `src/State/` : providers et processors API Platform.
- `src/Repository/` : requêtes Doctrine dédiées.
- `src/Security/` : authentification, vérifications et règles d'accès.
- `src/EventSubscriber/` : écouteurs et traitement transversal.
- `tests/` : tests PHPUnit.
- `migrations/` : migrations Doctrine générées par Symfony.

## Règles de développement

- Lire la règle ciblée dans `../.agents/rules/` avant toute modification.
- Utiliser les attributs PHP (`#[ApiResource]`, `#[Route]`, `#[IsGranted]`,
  `#[Assert\...]`) et le typage strict.
- Garder les contrôleurs, providers et processors fins ; déléguer la logique métier
  aux services.
- Utiliser l'autowiring et l'autoconfiguration existants avant d'ajouter une
  configuration de service manuelle.
- Valider et sérialiser les entrées avec les composants Symfony ou API Platform ;
  ne pas parser manuellement les requêtes JSON sans nécessité démontrée.
- Respecter les rôles existants (`ROLE_ADMIN`, `ROLE_ASSOCIATION` et rôles de
  gestion par module) et vérifier la propriété des ressources.
- Ne jamais exposer de secret, de mot de passe ou de donnée sensible dans une
  réponse d'API ou un fichier versionné.
- Ne jamais modifier manuellement un fichier de `migrations/`. Générer la migration,
  puis la relire avant de l'exécuter.

## Environnement Docker

Le développement local se fait depuis la racine du dépôt :

```bash
docker compose up --build
```

Le service `backend` expose l'API sur `http://localhost` et la documentation
OpenAPI sur `http://localhost/api/docs`. Le service utilise FrankenPHP et monte
`backend/` dans `/app`.

Pour exécuter une commande dans le conteneur backend :

```bash
docker compose exec backend php bin/console about
docker compose exec backend php bin/console <commande>
```

Les variables locales et secrets doivent rester dans `.env.local` ou dans le
gestionnaire de secrets Symfony. Ne pas ajouter de secret à `.env`, au dépôt ou
aux fichiers de configuration agentique.

## Migrations et fixtures

Après une modification d'entité, générer et relire la migration depuis le
conteneur :

```bash
docker compose exec backend php bin/console make:migration --no-interaction
docker compose exec backend php bin/console doctrine:migrations:migrate --no-interaction
```

Utiliser les fixtures existantes pour les données de développement et de test.
Ne pas utiliser `doctrine:schema:update` dans le workflow du projet.

## Tests et qualité

Depuis la racine :

```bash
docker compose exec backend php bin/phpunit
docker compose exec backend vendor/bin/phpstan analyse
```

Un nouvel endpoint doit avoir des tests fonctionnels couvrant au minimum les
réponses attendues, l'authentification et les autorisations pertinentes
(`401`, `403`, `404` et erreurs de validation selon le cas).

Avant de conclure, vérifier les conteneurs, les logs du service backend et la
documentation API si un endpoint a été ajouté ou modifié :

```bash
docker compose ps
docker compose logs backend
```
