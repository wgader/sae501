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
│   └── frontend/
│       └── Dockerfile      # Node.js 26
├── .github/
│   └── workflows/
│       ├── ci.yml          # Lint + tests sur chaque PR
│       └── cd.yml          # Build + deploy sur tag v*.*.*
├── .env.example            # Template des variables d'environnement
└── docker-compose.yml      # Orchestration des services
```

## Production

La CD publie les images backend et frontend dans GHCR. Configurez la variable
de dépôt GitHub `PUBLIC_API_URL` avec l'URL publique de l'API. Sur le serveur,
copiez
`.env.prod.example` vers `.env.prod`, renseignez les valeurs et remplacez les
domaines et secrets d'exemple. Le fichier `.env.prod` ne doit pas être commité.
Créez également les clés JWT hors du dépôt dans `secrets/jwt/private.pem` et
`secrets/jwt/public.pem` avant le premier démarrage.

```bash
mkdir -p secrets/jwt
openssl genrsa -out secrets/jwt/private.pem 4096
openssl rsa -pubout -in secrets/jwt/private.pem -out secrets/jwt/public.pem
docker compose --env-file .env.prod -f docker-compose.prod.yml pull
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d
```

Le backend écoute sur les ports 80/443 et Caddy gère automatiquement HTTPS pour
`API_DOMAIN`. Le frontend écoute sur `FRONTEND_PORT` (3000 par défaut) et doit
être exposé derrière le reverse proxy de l'hébergeur avec `PUBLIC_API_URL`
pointant vers le domaine public de l'API.

## Git Flow

```
feature/* → develop → main → tag v*.*.* → CD
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