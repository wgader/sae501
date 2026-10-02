---
description: Standards pour le développement Frontend (Next.js 16, React, TypeScript, Tailwind CSS v4).
globs: "frontend/src/**/*"
---
# Standards de Code Frontend (Next.js 16)

## Architecture App Router
- Respecter la séparation stricte entre les **Server Components** (récupération de données, SEO) et les **Client Components** (directive `"use client"`, limités à l'interactivité pure).
- **Data Fetching** : Les appels de données doivent cibler strictement le backend API Platform (Symfony). N'utilise pas d'ORMs (comme Prisma) directement dans Next.js.
- Principe de responsabilité unique (KISS) : Extraire la logique métier complexe dans des hooks personnalisés (`src/hooks/`) ou des utilitaires (`src/utils/`).

## TypeScript Strict
- Typage strict obligatoire pour tous les composants et fonctions.
- Générer ou définir des interfaces TypeScript qui correspondent *exactement* aux réponses JSON fournies par API Platform. Aucun `any` n'est toléré.

## Tailwind CSS v4 (Contraintes strictes)
- **Configuration Centralisée via `@theme`** : Tailwind v4 n'utilise plus de fichier `tailwind.config.js`. Toutes les variables (couleurs Mairie/Assos, espacements, typos) doivent être lues depuis le fichier CSS principal à la racine via la directive `@theme`.
- **Zéro Valeur Arbitraire** : L'utilisation de classes arbitraires (ex: `w-[15px]`, `text-[#ff0000]`, `mt-[7px]`) est **STRICTEMENT INTERDITE**. Tu dois obligatoirement utiliser les tokens du système de design définis dans le root theme.
- **Variables CSS Dynamiques** : Si une valeur doit changer dynamiquement via JS, utilise des variables CSS inline (`style={{ '--custom-color': var }}`) couplées à Tailwind, plutôt que des interpolations de chaînes de caractères complexes.
- **Maintenabilité** : Délègue la gestion des classes complexes ou conditionnelles à des utilitaires comme `tailwind-merge` ou `cva` pour garder le JSX lisible.

## Gestion des Erreurs et UX
- Sécuriser chaque appel API avec un `try/catch`. 
- Remonter une erreur claire et professionnelle à l'utilisateur via l'interface, et logger l'erreur technique dans la console pour le développeur.