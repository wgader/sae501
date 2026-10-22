---
trigger: glob
globs: "frontend/src/**/*.{ts,tsx,css}"
description: "Standards Next.js 16, React, TypeScript, HTML sémantique, accessibilité et Tailwind CSS pour frontend/src."
---
# Standards de Code Frontend (Next.js 16)

## Architecture App Router
- Respecter la séparation stricte entre les **Server Components** (récupération de données, SEO) et les **Client Components** (directive `"use client"`, limités à l'interactivité pure).
- **Data Fetching** : Les appels de données doivent cibler strictement le backend API Platform (Symfony). N'utilise pas d'ORMs (comme Prisma) directement dans Next.js.
- Principe de responsabilité unique (KISS) : Extraire la logique métier complexe dans des hooks personnalisés (`src/hooks/`) ou des utilitaires (`src/utils/`).
- **Décomposition** : Une page orchestre une fonctionnalité ; un composant présente une responsabilité. Extraire les blocs réutilisables ou les sous-parties avec leur propre état, et préférer la composition par `children`/props à des composants monolithiques ou à des composants définis dans le rendu.
- **Rendu lisible** : Calculer les états de rendu avant le JSX. Éviter les IIFE, ternaires imbriqués et fonctions qui retournent du JSX dans un autre `return`. Les `map` doivent rester dédiés à une liste homogène et utiliser une clé stable.
- **HTML sémantique** : Utiliser `main`, `header`, `nav`, `section`, `article`, `aside` et `footer` selon leur sens, avec un titre associé pour chaque `section`. Utiliser `ul`/`ol` pour les listes, `figure`/`figcaption` pour une illustration accompagnée de sa légende, et ne pas remplacer un élément interactif natif par un `div` cliquable.
- **Accessibilité** : Chaque page possède un `main`, les formulaires ont des labels associés, les images ont un `alt` adapté, les boutons ont un type explicite, et les états d'erreur/loading sont annoncés sans dépendre uniquement de la couleur.
- **Client boundary** : Ne mettre `"use client"` que sur le sous-arbre qui nécessite état, effets, handlers ou API navigateur. Laisser les pages et layouts en Server Components par défaut.

## TypeScript Strict
- Typage strict obligatoire pour tous les composants et fonctions.
- Générer ou définir des interfaces TypeScript qui correspondent *exactement* aux réponses JSON fournies par API Platform. Aucun `any` n'est toléré.

## Tailwind CSS v4 (Contraintes strictes)
- **Configuration Centralisée via `@theme`** : Tailwind v4 n'utilise plus de fichier `tailwind.config.js`. Toutes les variables (couleurs Mairie/Assos, espacements, typos) doivent être lues depuis le fichier CSS principal à la racine via la directive `@theme`.
- **Zéro Valeur Arbitraire** : L'utilisation de classes arbitraires (ex: `w-[15px]`, `text-[#ff0000]`, `mt-[7px]`) est **STRICTEMENT INTERDITE**. Tu dois obligatoirement utiliser les tokens du système de design définis dans le root theme.
- **Zéro Pixel, y compris depuis Figma MCP** : Ne jamais recopier de mesures en pixels dans le code ou les styles, même si elles proviennent d'une maquette Figma ou de Figma MCP. Traduire les dimensions, espacements et tailles en tokens du thème, classes Tailwind existantes ou variables CSS sémantiques déjà définies.
- **Variables CSS Dynamiques** : Si une valeur doit changer dynamiquement via JS, utilise des variables CSS inline (`style={{ '--custom-color': var }}`) couplées à Tailwind, plutôt que des interpolations de chaînes de caractères complexes.
- **Variantes UI obligatoirement avec CVA** : Pour tout composant UI réutilisable qui expose des variantes ou tailles (boutons, badges, champs, etc.), utilise `class-variance-authority` avec un export de variantes typé via `VariantProps`. Compose les classes finales avec `cn` (`tailwind-merge`) et ne duplique pas les chaînes de classes conditionnelles dans le JSX. Le composant [`Button`](../../frontend/src/components/ui/Button.tsx) est la référence à respecter.

## Gestion des Erreurs et UX
- Sécuriser chaque appel API avec un `try/catch`. 
- Remonter une erreur claire et professionnelle à l'utilisateur via l'interface, et logger l'erreur technique dans la console pour le développeur.