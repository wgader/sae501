---
description: Règles globales du projet SAE501, architecture, Git workflow et Mindset Senior. À appliquer à chaque interaction.
globs: "*"
---
# Projet SAE501 - Plateforme d'échange Associations / Mairie

## Architecture et Stack
- **Frontend** : `frontend/` - Next.js 16 (App Router), TypeScript, Tailwind CSS v4. (http://localhost:3000)
- **Backend** : `backend/` - Symfony 8.1, API Platform, JWT, Doctrine ORM. (http://localhost:80)
- **Serveur & Infra** : FrankenPHP, MySQL 8.4, Docker Compose (`docker compose up --build`).

## Mindset Senior & Anti-Overengineering (KISS)
- **Simplicité avant tout** : Ne propose pas de bibliothèques tierces, de design patterns complexes ou d'abstractions inutiles si une solution native et simple suffit.
- **Clean Code** : Produis un code concis. Aucun code mort, aucun `console.log` oublié, aucune variable inutilisée ou code commenté ne doit être conservé.
- **Early Returns** : Privilégie les sorties précoces (`if (!condition) return;`) pour éviter les imbrications complexes de `if/else`.
- **Nommage** : Les noms de variables, méthodes et classes doivent être auto-descriptifs et en anglais. Commente uniquement le "pourquoi" (décisions métier), jamais le "comment".

## Workflow Git
- **Branche de départ** : Toujours partir de `develop` et s'assurer qu'elle est à jour.
- **Développement** : Créer une branche `feature/<nom-de-la-feature>`.
- **Commits (Conventional Commits obligatoires)** : 
  - Exemples : `feat(front): add Tailwind root theme`, `fix(back): resolve JWT token issue`, `chore: update dependencies`.
- **Règle absolue** : Ne jamais modifier le dossier `backend/migrations/` manuellement. Toujours utiliser `php bin/console make:migration`.