---
name: code-review-and-quality
description: Effectue une revue de code multi-axes adaptée à Symfony et Next.js. À utiliser avant de fusionner tout changement, pour évaluer la qualité du code sur plusieurs dimensions avant son intégration sur la branche principale.
---

# Code Review and Quality (Adapté pour SAE501)

## Vue d'ensemble
Revue de code multidimensionnelle avec des barrières de qualité. Chaque modification doit être revue avant sa fusion sur la branche principale — sans exception. La revue couvre cinq axes : exactitude, lisibilité, architecture, sécurité et performances.

**Le standard d'approbation :** Approuvez un changement s'il améliore définitivement la santé globale du code, même s'il n'est pas parfait. Le code parfait n'existe pas — le but est l'amélioration continue. Ne bloquez pas un changement simplement parce qu'il n'est pas écrit exactement comme vous l'auriez fait. S'il améliore le projet `sae501` et suit les conventions (définies dans vos règles `.agents/rules/`), approuvez-le.

## Quand l'utiliser
- Avant de fusionner toute Pull Request ou modification (notamment sur des branches de fonctionnalités comme `feature-us2-1-login`).
- Après avoir terminé l'implémentation d'une fonctionnalité (ex: le tunnel d'inscription frontend).
- Lorsqu'un autre agent ou modèle produit du code que vous devez évaluer.
- Lors du refactoring de code existant (ex: nettoyage des Entités Doctrine).
- Après toute correction de bug (révisez à la fois le correctif et le test de non-régression).

## La Revue en Cinq Axes

### 1. Exactitude
Le code fait-il ce qu'il prétend faire ?
- Correspond-il aux spécifications ou aux exigences de la tâche ?
- Les cas extrêmes sont-ils gérés (valeurs nulles, champs de formulaires vides dans Next.js, limites) ?
- Les chemins d'erreur sont-ils gérés (pas seulement le scénario idéal) ?
- Passe-t-il tous les tests de `phpunit.dist.xml` pour le backend ? Les tests vérifient-ils réellement les bonnes choses ?
- Y a-t-il des erreurs de décalage d'index, des conditions de course (race conditions) ou des incohérences d'état (notamment dans `SignupContext.tsx`) ?

### 2. Lisibilité & Simplicité
Un autre ingénieur peut-il comprendre ce code sans explication de l'auteur ?
- Les noms sont-ils descriptifs et cohérents avec les conventions PHP/TypeScript ? (Pas de variables `temp` ou `data` sans contexte).
- Le flux de contrôle est-il direct (évitez les opérateurs ternaires imbriqués dans les templates Twig ou les composants React) ?
- L'abstraction justifie-t-elle sa complexité ? (Ne généralisez pas avant le troisième cas d'usage).
- Ce code pourrait-il être écrit en moins de lignes ? (Un composant de 1000 lignes dans `src/components/` est un échec).
- Y a-t-il des artefacts de code mort : variables non utilisées détectables par `eslint.config.mjs`, ou commentaires `// supprimé` ?

### 3. Architecture
Le changement s'intègre-t-il dans la conception du système ?
- Respecte-t-il les frontières propres (API Platform côté Symfony, Server/Client components côté Next.js) ?
- Les dépendances circulent-elles dans le bon sens (pas de dépendances circulaires) ?
- Y a-t-il du code dupliqué qui devrait être partagé (ex: créer un composant UI générique plutôt que de dupliquer `Button.tsx`) ?

### 4. Sécurité
Le changement introduit-il des vulnérabilités ?
- Les entrées utilisateurs (comme celles de `RegistrationController.php`) sont-elles validées et nettoyées ?
- Les secrets (clés JWT, mots de passe de base de données) sont-ils hors du code et bien confinés dans les variables `.env` ?
- Les vérifications d'authentification (`security.yaml` et `lexik_jwt_authentication.yaml`) sont-elles en place là où c'est nécessaire ?
- Les requêtes SQL/DQL sont-elles paramétrées via Doctrine pour éviter les injections ?
- Les données provenant de sources externes sont-elles traitées comme non fiables ?

### 5. Performances
Le changement introduit-il des problèmes de performances ?
- Y a-t-il des modèles de requêtes N+1 (fréquent avec Doctrine dans Symfony) ?
- Y a-t-il des boucles infinies ou des récupérations de données non limitées ?
- Y a-t-il des rendus inutiles dans les composants UI Next.js (ex: `RoomCalendar.tsx` qui se rechargerait trop souvent) ?
- Manque-t-il une pagination sur les points de terminaison renvoyant des listes depuis l'API ?

## Dimensionnement des Changements
Les petits changements sont plus faciles à revoir, plus rapides à fusionner et plus sûrs à déployer.
```
~100 lignes modifiées  → Idéal. Révisable en une seule session.
~300 lignes modifiées  → Acceptable s'il s'agit d'un seul changement logique.
~1000 lignes modifiées → Trop volumineux. Divisez-le.
```

**Stratégies de division quand un changement est trop important :**

| Stratégie | Comment | Quand l'utiliser |
|-----------|---------|------------------|
| **Empilement** | Soumettre un petit changement, commencer le suivant basé sur celui-ci. | Dépendances séquentielles |
| **Par groupe de fichiers** | Séparer les modifications front et back pour des réviseurs différents. | Préoccupations transversales |
| **Horizontale** | Créer d'abord le code partagé/les stubs (ex: Entités, Interfaces), puis les consommateurs. | Architecture en couches |
| **Verticale** | Diviser en tranches full-stack plus petites de la fonctionnalité. | Travail sur une fonctionnalité |

*Remarque : Séparez toujours le refactoring du travail sur une fonctionnalité.*

## Descriptions des Changements
**Première ligne :** Courte, impérative, autonome. Ex: "Supprime l'ancienne route d'inscription" (et non "Fix bug" ou "Phase 1").
**Corps :** Ce qui change et pourquoi. Incluez le contexte et les décisions non visibles dans le code.

## Processus de Revue

### Étape 1 : Comprendre le Contexte
- Qu'est-ce que ce changement essaie d'accomplir (ex: User Story 2.1 Login) ?
- Quel est le changement de comportement attendu ?

### Étape 2 : Revoir les Tests en Premier
- Des tests existent-ils pour ce changement ?
- Couvrent-ils les cas extrêmes ? Attraperaient-ils une régression ?

### Étape 3 : Revoir l'Implémentation
Parcourez le code en gardant à l'esprit les 5 axes (Exactitude, Lisibilité, Architecture, Sécurité, Performances).

### Étape 4 : Catégoriser les Retours
Étiquetez chaque commentaire avec sa sévérité :

| Préfixe | Signification | Action de l'auteur |
|---------|---------------|--------------------|
| *(sans préfixe)* | Changement requis | Doit être corrigé avant la fusion |
| **Critique:** | Bloque la fusion | Vulnérabilité, perte de données, casse applicative |
| **Nit:** | Mineur, optionnel | Préférences de style, formatage (l'auteur peut ignorer) |
| **Suggestion:** | Piste d'amélioration | À considérer, mais non requis |
| **Info:** | Informative uniquement | Aucune action requise |

### Étape 5 : Vérifier la Validation
- Les tests ont-ils été exécutés via `phpunit` ou le pipeline d'intégration continue `ci.yml` ?
- Le build des conteneurs Docker (caddy, php, frontend) a-t-il réussi ?

## Modèle de Revue Multi-Agents
Utilisez différents modèles pour différentes perspectives :
```
Modèle A (ou Humain) écrit le code
    │
    ▼
Modèle B revoit l'exactitude et l'architecture (en se basant sur les règles dans .agents/rules/)
    │
    ▼
Modèle A traite les retours
    │
    ▼
Humain prend la décision finale
```

## Hygiène du Code Mort
Après toute refactorisation, vérifiez les codes orphelins (composants UI inutilisés, vieilles migrations de base de données dans `backend/migrations/`). Listez-les explicitement et demandez avant de les supprimer définitivement.

## Vitesse de Revue
Les revues lentes bloquent toute l'équipe. Priorisez des réponses individuelles rapides plutôt qu'une approbation finale rapide. Pour les changements massifs, demandez à l'auteur de les diviser.

## Gestion des Désaccords
En cas de litige, appliquez cette hiérarchie :
1. Les faits techniques et les données priment.
2. Les guides de style (eslint, phpstan) sont l'autorité absolue sur le formatage.
3. Le design logiciel doit être évalué sur des principes d'ingénierie, pas sur des préférences personnelles.

**N'acceptez pas le "je nettoierai plus tard".** L'expérience montre que cela n'arrive jamais.

## Honnêteté dans la Revue
- **Ne validez pas à l'aveugle.** "LGTM" (Looks Good To Me) sans preuve de revue n'aide personne.
- **Quantifiez les problèmes.** "Cette requête N+1 va alourdir le chargement de l'API" est mieux que "ça pourrait être lent".
- Le code généré par l'IA a besoin de plus d'examen, pas de moins. Il est confiant et plausible, même lorsqu'il a tort.

## Discipline des Dépendances
Avant d'ajouter toute dépendance dans `composer.json` ou `package.json` :
1. La stack actuelle résout-elle le problème ?
2. Quel est l'impact sur le poids du bundle ou les performances ?
3. Le paquet a-t-il des vulnérabilités connues ?

## Rationalisations Courantes

| Rationalisation | Réalité |
|-----------------|---------|
| "Ça marche, c'est suffisant" | Un code qui fonctionne mais illisible ou non sécurisé crée une dette qui s'accumule. |
| "Je l'ai écrit, je sais que c'est correct" | Les auteurs sont aveugles à leurs propres hypothèses. Un autre regard est nécessaire. |
| "On nettoiera plus tard" | Plus tard n'arrive jamais. Exigez le nettoyage avant la fusion. |
| "Les tests passent, donc c'est bon" | Les tests sont nécessaires mais insuffisants (ils ne vérifient pas l'architecture ou la lisibilité). |

## Signaux d'Alarme (Red Flags)
- Pull Requests fusionnées sans aucune revue.
- Revue qui vérifie uniquement si les tests passent.
- Modifications sensibles à la sécurité sans revue axée sur la sécurité.
- Aucune étiquette de sévérité sur les commentaires.

## Checklist de Revue
- [ ] Le contexte est compris.
- [ ] **Exactitude :** Cas extrêmes et chemins d'erreur gérés. Tests adéquats.
- [ ] **Lisibilité :** Logique claire, complexité minimale.
- [ ] **Architecture :** Respect des modèles existants Symfony/Next.js.
- [ ] **Sécurité :** Entrées validées, auth vérifiée (`security.yaml`).
- [ ] **Performances :** Pas de requêtes N+1, boucles sous contrôle.
- [ ] **Validation :** Le workflow CI réussit (`.github/workflows/ci.yml`), tests au vert.