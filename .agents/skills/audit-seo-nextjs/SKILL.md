---
name: audit-seo-nextjs
description: Effectue un audit SEO, sémantique et de performance ciblé sur les pages Next.js publiques pour maximiser la visibilité, l'accessibilité et le classement sur les moteurs de recherche.
---

# Compétence : Audit SEO et Frontend (Spécial Next.js)

Utilisez cette compétence pour effectuer un audit SEO ciblé sur les pages publiques de l'application (frontend Next.js). L'objectif est d'optimiser le référencement naturel, la sémantique HTML et les Core Web Vitals.

## Quand l'utiliser

- Avant de fusionner une PR modifiant des pages publiques (`src/app/page.tsx`, etc.).
- Lors de l'ajout ou de la modification de l'export `metadata` dans les fichiers `layout.tsx` ou `page.tsx`.
- Lors d'audits de performance ou d'accessibilité.
- Après l'ajout de nouveaux composants d'interface interactifs.

## Objectif

Chaque page publique doit être optimisée pour :
- Être parfaitement indexable par Google (Balises Meta, OpenGraph).
- Offrir une structure sémantique claire (H1 unique, hiérarchie des balises).
- Garantir des temps de chargement optimaux (utilisation de `next/image`, `next/font`).
- Assurer une accessibilité irréprochable (ARIA, contrastes, navigation clavier).

---

## Méthodologie d'Audit SEO

Suivez ces 5 étapes pour un audit complet d'une page Next.js.

### Étape 1 : Audit des Métadonnées (Next.js Metadata API)
Vérifiez l'export `metadata` ou la génération dynamique `generateMetadata`.

### Étape 2 : Audit de la Structure Sémantique (HTML5)
Vérifiez l'arborescence des titres et l'utilisation des balises sémantiques.

### Étape 3 : Audit des Performances (Core Web Vitals)
Assurez-vous que les composants n'impactent pas le Largest Contentful Paint (LCP) ou le Cumulative Layout Shift (CLS).

### Étape 4 : Audit d'Accessibilité (Impact SEO)
Les moteurs de recherche pénalisent les sites non accessibles. Vérifiez les attributs `alt` et les rôles ARIA.

### Étape 5 : Génération du Rapport
Documentez les résultats à l'aide du modèle de rapport.

---

## Checklists d'Audit

### 1. Checklist des Balises Meta (Title & Description) (4 points)

| # | Vérification | Points | Comment vérifier dans Next.js |
|---|--------------|--------|-------------------------------|
| 1 | Titre : 50-60 caractères | 1 | Compter les caractères dans `metadata.title` |
| 2 | Description : 150-160 caractères | 1 | Compter les caractères dans `metadata.description` |
| 3 | Mot-clé principal inclus | 1 | Présent dans le titre ET la description |
| 4 | Balises OpenGraph présentes | 1 | Vérifier `metadata.openGraph` (title, description, images) |

**Exemple idéal dans Next.js :**
```typescript
export const metadata: Metadata = {
  title: 'Réservation de Salles : Trouvez votre espace idéal', // 54 caractères
  description: 'Découvrez et réservez facilement nos salles de réunion équipées. Gérez vos événements grâce à notre calendrier interactif et nos options sur mesure.', // 152 caractères
  openGraph: {
    title: 'Réservation de Salles : Trouvez votre espace idéal',
    images: ['/assets/og-image.jpg'],
  }
}
```

### 2. Checklist de Structure Sémantique (4 points)

| # | Vérification | Points | Comment vérifier |
|---|--------------|--------|------------------|
| 1 | Un seul H1 par page | 1 | Chercher `<h1>` dans le composant principal |
| 2 | Hiérarchie respectée | 1 | Pas de saut de `<h2>` à `<h4>` |
| 3 | Contenu principal dans `<main>` | 1 | Vérifier le layout englobant |
| 4 | Sections sémantiques utilisées | 1 | Utilisation de `<section>`, `<article>`, `<aside>`, `<nav>` |

### 3. Checklist des Performances (4 points)

| # | Vérification | Points | Comment vérifier dans Next.js |
|---|--------------|--------|-------------------------------|
| 1 | Utilisation de `next/image` | 1 | Pas de balise `<img>` standard pour les assets statiques |
| 2 | Tailles des images définies | 1 | Attributs `width` et `height` (ou `fill`) présents pour éviter le CLS |
| 3 | Liens pré-chargés | 1 | Utilisation de `<Link>` de `next/link` au lieu de `<a>` |
| 4 | Polices optimisées | 1 | Utilisation de `next/font/google` ou `next/font/local` |

### 4. Checklist d'Accessibilité / SEO UX (4 points)

| # | Vérification | Points | Comment vérifier |
|---|--------------|--------|------------------|
| 1 | Attributs `alt` pertinents | 1 | Chaque `<Image>` a un attribut `alt` descriptif (pas vide, sauf décoration) |
| 2 | Liens explicites | 1 | Pas de texte de lien type "Cliquez ici" ou "En savoir plus" |
| 3 | Contraste des textes | 1 | Les classes Tailwind garantissent un bon contraste (ex: `text-gray-900`) |
| 4 | Éléments interactifs | 1 | Les boutons (ex: `Button.tsx`) ont des `aria-label` si pas de texte explicite |

---

## Système de Notation

### Total des points : 16

| Catégorie | Points Max |
|-----------|------------|
| Métadonnées | 4 |
| Sémantique | 4 |
| Performances | 4 |
| Accessibilité | 4 |
| **Total** | **16** |

### Interprétation du Score

| Score | Pourcentage | Statut | Action |
|-------|------------|--------|--------|
| 14-16 | 90-100% | ✅ Excellent | Prêt pour la production |
| 11-13 | 70-89% | ⚠️ Correct | Optimisations mineures requises |
| 0-10 | <70% | ❌ Faible | Travail significatif requis avant de fusionner |

---

## Problèmes Courants et Solutions (Next.js)

| Problème | Solution |
|----------|----------|
| Plusieurs balises `<h1>` | Modifier les titres secondaires en `<h2>` avec des classes Tailwind pour l'apparence (`text-4xl`). |
| Fichier `.tsx` sans `metadata` | Ajouter l'export `metadata` ou générer le titre depuis le `layout.tsx` parent avec les templates. |
| Erreurs de `next/image` | Ajouter des attributs `sizes` pour le responsive ou utiliser `priority={true}` pour l'image LCP. |
| Liens brisés ou URL non optimisées | S'assurer que les dossiers dans `src/app/` utilisent des noms en minuscules avec tirets (ex: `/signup/step1`). |

---

## Modèle de Rapport d'Audit SEO

Utilisez ce modèle pour documenter vos trouvailles lors de la revue d'une PR ou d'un fichier.

```markdown
# Rapport d'Audit SEO & Frontend : [Nom de la Page/Composant]

**Fichier :** `src/app/[route]/page.tsx`
**Date :** AAAA-MM-JJ
**Auditeur :** [Nom de l'agent]
**Score Global :** XX/16 (XX%)
**Statut :** ✅ Excellent | ⚠️ Correct | ❌ Faible

---

## Résumé des Scores

| Catégorie | Score | Statut |
|-----------|-------|--------|
| Métadonnées | X/4 | ✅/⚠️/❌ |
| Sémantique | X/4 | ✅/⚠️/❌ |
| Performances | X/4 | ✅/⚠️/❌ |
| Accessibilité | X/4 | ✅/⚠️/❌ |
| **Total** | **X/16** | **STATUT** |

---

## 1. Analyse des Métadonnées

**Titre Actuel :** "[Titre]" (XX caractères)
**Description Actuelle :** "[Description]" (XX caractères)

**Problèmes détectés :**
- [Ex: La description est trop courte ou absente]

**Recommandation :**
```typescript
export const metadata: Metadata = {
  title: 'Nouveau Titre Optimisé',
  description: 'Nouvelle description contenant les mots-clés pertinents...'
}
```

## 2. Analyse Sémantique et HTML

**Problèmes détectés :**
- [Ex: Présence de deux balises H1, manque de balise `<main>`]

**Actions correctives :**
- [ ] Transformer le second `<h1>` en `<h2>`.

## 3. Analyse des Performances (Next.js)

**Problèmes détectés :**
- [Ex: Utilisation d'une balise `<img>` native au lieu de `next/image`]

**Actions correctives :**
- [ ] Remplacer par `<Image src="..." alt="..." width={...} height={...} />`.

## 4. Accessibilité (A11y)

**Problèmes détectés :**
- [Ex: Le composant `Button` n'a pas de nom accessible]

**Actions correctives :**
- [ ] Ajouter un attribut `aria-label="Action spécifique"`.

---

## Recommandation Finale

**Prêt à fusionner :** ✅ Oui / ❌ Non - [Raison, ex: Corriger les balises H1 d'abord]
```

---

## Résumé de la Compétence

Lors de l'audit d'une page frontend pour le projet :
1. Vérifier la configuration de `metadata` dans le fichier de la page.
2. S'assurer qu'il y a un et un seul `<h1>`.
3. Bannir les balises `<a>` et `<img>` classiques au profit de `<Link>` et `<Image>`.
4. Valider que chaque image a un `alt` et chaque bouton un texte compréhensible.
5. Rédiger le rapport pour l'humain.