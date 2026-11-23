# SAE501

Application web full-stack — plateforme de gestion entre associations et mairie.

## Stack

- **Frontend** — Next.js 16, TypeScript, Tailwind CSS
- **Backend** — Symfony 8.1, API Platform, FrankenPHP
- **Base de données** — MySQL 8.4 + phpMyAdmin
- **Serveur** — FrankenPHP (Caddy intégré, HTTPS automatique)
- **Infrastructure** — Docker, GitHub Actions CI/CD

## Prérequis

- Docker + Docker Compose

## Installation

```bash
git clone git@github.com:wgader/SAE501.git
cd SAE501
cp .env.example .env  # remplir les valeurs
docker compose up --build
```

Après l'installation des dépendances Node à la racine, Husky active le hook
`pre-commit` et `lint-staged` vérifie uniquement les fichiers staged :

```bash
npm install
```

Le backend fournit également PHP CS Fixer via Composer :

```bash
docker compose exec backend composer install --no-scripts
docker compose exec backend php vendor/bin/php-cs-fixer check --config=.php-cs-fixer.dist.php
```

Le service `backend` doit être démarré pour exécuter ces commandes et le hook
`pre-commit`.

Les tests PHPUnit forcent automatiquement l’environnement Symfony `test`, y
compris lorsque le conteneur Docker utilise `APP_ENV=dev` pour l’application :

```bash
docker compose exec backend php bin/phpunit
```

Les clés JWT de test ne nécessitent aucune configuration : `tests/bootstrap.php`
génère une paire jetable dans `backend/var/cache/test/jwt/` au premier lancement
(ou après un vidage du cache), et l’environnement `test` l’utilise toujours, même
si des variables `JWT_*` sont définies par Docker ou la CI.

### Migrations Doctrine

Depuis le 15/11/2026, l’historique des migrations est regroupé dans une seule
migration de base, générée par Symfony depuis le mapping (l’ancienne chaîne ne
pouvait plus construire une base vide : `notification` et `campaign` y étaient
créées deux fois). Une base neuve se construit avec :

```bash
docker compose exec backend php bin/console doctrine:migrations:migrate --no-interaction
```

Pour une base locale créée avant ce regroupement, une seule fois :

- base jetable (cas habituel en développement) — les données locales sont perdues
  puis recréées par les fixtures :

  Les fixtures lisent le mot de passe des comptes de démonstration dans `FIXTURES_PASSWORD`
  (10 caractères minimum, avec majuscule, minuscule et chiffre), à placer dans
  `backend/.env.local` qui n’est jamais versionné.

  ```bash
  docker compose exec backend php bin/console doctrine:database:drop --force
  docker compose exec backend php bin/console doctrine:database:create
  docker compose exec backend php bin/console doctrine:migrations:migrate --no-interaction
  docker compose exec backend php bin/console doctrine:fixtures:load --no-interaction
  ```

- base à conserver : relire d’abord le SQL proposé, qui ne doit contenir aucun
  `DROP` ni suppression de colonne, puis appliquer ce rattrapage unique et recaler
  l’historique des migrations. C’est la seule exception admise à l’interdiction de
  `doctrine:schema:update` (testée sur une copie : aucune ligne modifiée).

  ```bash
  docker compose exec backend php bin/console doctrine:schema:update --dump-sql
  docker compose exec backend php bin/console doctrine:schema:update --force
  docker compose exec backend php bin/console doctrine:migrations:version --delete --all --no-interaction
  docker compose exec backend php bin/console doctrine:migrations:version --add --all --no-interaction
  docker compose exec backend php bin/console doctrine:schema:validate
  ```

| Service    | URL                         |
|------------|-----------------------------|
| Frontend   | http://localhost:3000       |
| Backend    | http://localhost:80         |
| API Docs   | http://localhost/api/docs   |
| phpMyAdmin | http://localhost:8080       |

## Structure

```
SAE501/
├── frontend/               # Next.js 16 — App Router, TypeScript, Tailwind
├── backend/                # Symfony 8.1 — API Platform, JWT, Doctrine ORM
│   ├── src/
│   │   ├── Entity/         # Entités Doctrine
│   │   ├── Repository/     # Repositories
│   │   └── ApiResource/    # Ressources API Platform
│   ├── config/
│   │   ├── packages/       # Configuration des bundles
│   │   └── routes/         # Définition des routes
│   └── migrations/         # Migrations Doctrine
├── docker/
│   ├── backend/
│   │   ├── Dockerfile      # FrankenPHP + PHP 8.5
│   │   ├── Caddyfile       # Configuration Caddy
│   │   └── php.ini         # Configuration PHP
│   ├── frontend/
│   │   └── Dockerfile      # Node.js 26
│   └── deploy/             # Mise en service du VPS, déploiement, sauvegardes, proxy d’entrée
├── .github/
│   └── workflows/
│       ├── ci.yml          # Lint + tests sur chaque PR
│       └── cd.yml          # Images GHCR + déploiement SSH (develop → preprod, main → prod)
├── .env.example            # Template des variables d'environnement (développement)
├── .env.preprod.example    # Modèle du .env de préproduction (serveur)
├── .env.prod.example       # Modèle du .env de production (serveur)
├── DEPLOYMENT.md           # Guide de déploiement et d’exploitation
├── docker-compose.yml      # Orchestration des services (développement)
└── docker-compose.prod.yml # Pile d’un environnement de préproduction ou de production
```

## Production

La préproduction (`develop`) et la production (`main`) sont déployées sur le même VPS par
`.github/workflows/cd.yml` : images publiées sur GHCR sous le SHA du commit, puis déploiement
SSH (pull, sauvegarde, migrations Doctrine, `up --wait`, healthchecks, retour arrière
automatique). La procédure complète — DNS, secrets GitHub, mise en service du serveur avec
`docker/deploy/bootstrap-server.sh`, sauvegardes, restauration, Brevo et Cloudflare — est dans
[DEPLOYMENT.md](DEPLOYMENT.md).

En résumé :

- chaque environnement est un projet Compose distinct (`sae501-preprod`, `sae501-prod`) avec son
  `.env`, ses mots de passe, sa base, ses volumes et ses clés JWT, générés sur le serveur ;
  modèles : `.env.preprod.example` et `.env.prod.example` (aucune valeur réelle) ;
- seul le proxy d’entrée `docker/deploy/edge` (Caddy, HTTPS automatique) publie 80/443 ; MySQL,
  phpMyAdmin et Mailpit ne sont jamais exposés ;
- l’image backend de production tourne sans root (UID 10001), sans dépendances de
  développement ni Composer, avec seulement `var/`, `public/uploads`, `/data` et `/config` en
  écriture ; le développement utilise le stage `dev` (`target: dev` dans `docker-compose.yml`).

Les fichiers envoyés sont conservés dans deux volumes Docker nommés, sauvegardés chaque nuit
par `docker/deploy/backup.sh` :

- `<projet>_backend_uploads` (`/app/public/uploads`) : images publiques des salles et du matériel ;
- `<projet>_backend_private_uploads` (`/app/var/uploads`) : justificatifs et fichiers
  d'événement, servis uniquement par l'API après contrôle d'accès.

Ces dossiers, `backend/var` et les clés JWT sont exclus du contexte de build
(`.dockerignore`) et ne sont jamais intégrés à une image.

### E-mails (Brevo)

En local, les e-mails sont capturés par Mailpit (http://localhost:8025). En
préproduction et en production, ils partent par Brevo grâce au bridge
`symfony/brevo-mailer` : renseigner dans le `.env` de l’environnement sur le serveur
`MAILER_DSN=brevo+api://<clé API>@default` et `MAILER_FROM` (adresse validée dans
Brevo). Utiliser une clé distincte par environnement et ne jamais la versionner ni
la partager hors du serveur ; une clé exposée doit être révoquée dans Brevo.
Configurer aussi SPF, DKIM et DMARC sur le domaine d’envoi (voir DEPLOYMENT.md).

Les notifications asynchrones (réservations de salle) passent par la file Doctrine
`MESSENGER_TRANSPORT_DSN=doctrine://default?auto_setup=0`, consommée en production par
le service `messenger-worker` de `docker-compose.prod.yml`. Les messages en échec sont
conservés dans la file `failed` :

```bash
docker exec sae501-prod-messenger-worker-1 php bin/console messenger:failed:show --env=prod
```

### Tests end-to-end (Playwright)

La CI démarre une pile complète (MySQL, migrations, fixtures, API Symfony et
frontend compilé) puis exécute les parcours sur Chromium avec les comptes de
démonstration des fixtures, dont le mot de passe est tiré au hasard à chaque exécution.
En local, avec l’API et le frontend lancés, exporter `TEST_ADMIN_PASSWORD` et
`TEST_USER_PASSWORD` (valeur de `FIXTURES_PASSWORD`) puis :

```bash
npm --prefix frontend run test:e2e -- --project=chromium
```

## Git Flow

```
feature/* → develop (CD → préproduction) → main (CD → production, après approbation)
```

- `main` — production, protégé, PR obligatoire
- `develop` — intégration, protégé, PR obligatoire
- `feature/*` — développement, une branche par fonctionnalité

## Équipe

| Nom            | Rôle       |
|----------------|------------|
| Wahel Gader    | Back-end   |
| Vivien Pain    | Front-end  |
| Suzanne Kamara | —          |
| Manon Lippler  | —          |