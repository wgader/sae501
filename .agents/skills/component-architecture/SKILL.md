---
name: component-architecture
description: "Conçoit ou refactorise une interface React/Next.js en composants lisibles, sémantiques et accessibles. À utiliser pour créer une page, découper un composant monolithique, remplacer des divs génériques, organiser un formulaire ou clarifier des retours JSX imbriqués."
argument-hint: "[page ou composant à créer/refactoriser]"
---
# Architecture de composants React/Next.js

## Objectif

Obtenir une interface dont la structure HTML décrit le contenu, dont les responsabilités sont localisées et dont le rendu reste lisible sans multiplier les abstractions.

## Procédure

1. Lire la page, ses composants enfants, les tokens CSS et les composants UI existants avant de créer quoi que ce soit.
2. Identifier le rôle de chaque bloc : structure de page, contenu de domaine, interaction, état de chargement/erreur ou primitive UI.
3. Garder la page comme orchestrateur. Extraire un bloc lorsqu'il possède son propre état ou effet, est réutilisé, a un nom métier clair ou rend le parent difficile à lire.
4. Définir des props TypeScript minimales et stables. Préférer `children` pour la composition de conteneurs et des callbacks explicites pour remonter une action.
5. Choisir l'élément HTML selon le sens :
   - `main` une fois par page, `header`/`footer` pour les zones correspondantes ;
   - `nav` uniquement pour un groupe de liens de navigation ;
   - `section` pour un thème identifiable, avec un titre visible ou masqué ;
   - `article` pour un contenu autonome réutilisable ;
   - `aside` pour un contenu complémentaire ;
   - `ul`/`ol` pour des listes ;
   - `figure` avec `figcaption` lorsqu'une image, icône ou visualisation a une légende ou une attribution.
6. Remplacer les états imbriqués par des gardes nommées ou des sous-composants (`LoadingState`, `ErrorState`, `EmptyState`). Éviter les IIFE, ternaires imbriqués et `return` de JSX dans un autre `return`.
7. Vérifier les interactions : élément natif (`button`, `a`, `input`) avant tout rôle ARIA, labels associés, focus visible, clavier et annonce des erreurs/chargements.
8. Conserver les Server Components par défaut. Isoler `"use client"` au plus petit sous-composant qui utilise état, effet, événement ou API navigateur.
9. Chercher une primitive existante avant d'en créer une nouvelle. Ne pas extraire un composant uniquement pour réduire un nombre de lignes.
10. Pour toute primitive UI avec variantes ou tailles, utiliser CVA (`cva` + `VariantProps`) et `cn` pour composer les classes. Suivre le modèle de `frontend/src/components/ui/Button.tsx` plutôt que de conditionner directement des chaînes Tailwind dans le JSX.
11. Ne jamais ajouter de valeurs en pixels (`px`) dans le code ou les styles, même lorsqu'elles sont fournies par Figma MCP. Convertir les mesures du design en tokens du thème, classes Tailwind existantes ou variables CSS sémantiques déjà définies.
12. Lancer le lint et le build frontend si la modification touche le rendu ; signaler les limites et les écarts restants.

## Checklist de sortie

- Un seul `main` par page et une hiérarchie de titres cohérente.
- Les `div` servent uniquement de conteneurs de mise en page, pas de structure sémantique ou d'interaction.
- Les listes ont un élément parent de liste et une clé stable.
- Les images décoratives ont `alt=""`, les images informatives un texte alternatif utile.
- Les composants n'ont pas de logique métier dupliquée ni de retour JSX imbriqué.
- Les variantes et tailles des primitives UI sont définies avec CVA et leurs props sont typées avec `VariantProps`.
- Aucune valeur en pixels issue du design ou de Figma MCP n'est ajoutée ; les espacements, tailles et dimensions utilisent les tokens du système de design.
- Les props, états et callbacks sont typés sans `any`.
- Les composants interactifs restent testables sans dépendre d'un sélecteur CSS.
