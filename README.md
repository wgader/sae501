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