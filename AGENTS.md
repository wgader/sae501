# SAE501 — Plateforme Associations / Mairie

Application full-stack composée d'un frontend Next.js et d'une API Symfony pour les démarches des associations auprès de la mairie.

## Stack et structure

- `frontend/` : Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS v4.
- `backend/` : Symfony 8.1, API Platform, Doctrine ORM, JWT.
- `docker-compose.yml` : frontend, FrankenPHP/MySQL et phpMyAdmin.
- `frontend/src/app/` : routes et layouts ; `frontend/src/components/` : composants par domaine ; `frontend/src/hooks/` et `frontend/src/lib/` : logique réutilisable et accès API.

## Commandes

- Démarrer les services : `docker compose up --build`
- Lint frontend : `npm --prefix frontend run lint`
- Build frontend : `npm --prefix frontend run build`
- Tests PHP : `cd backend` puis `php bin/phpunit`
- Analyse PHP : `cd backend` puis `vendor/bin/phpstan analyse`

## Règles générales

- Lire la règle ciblée dans `.agents/rules/` avant de modifier le domaine concerné.
- Consulter la documentation officielle via Context7 avant d'utiliser une API Next.js, React, Symfony, API Platform ou Doctrine incertaine ; noter la source utilisée dans le compte rendu.
- Ne jamais mettre de secret dans le dépôt ou `.agents/`. Ne jamais pousser ni committer sans demande explicite.
- Ne jamais modifier manuellement `backend/migrations/` : générer une migration avec Symfony, puis la relire.
- Après une modification, lancer la vérification la plus ciblée disponible et décrire les résultats.

## Configuration agentique

- Les règles ciblées sont dans `.agents/rules/`.
- Les procédures répétables sont dans `.agents/skills/`.
- Le skill `component-architecture` s'applique à la création ou refactorisation d'interfaces React.
- Le skill `code-review-and-quality` sert à relire une livraison sans modifier les fichiers.
