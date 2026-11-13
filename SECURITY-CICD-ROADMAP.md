# Rapport de finalisation et feuille de route sécurité

## État actuel

Les derniers correctifs applicatifs réalisés concernent :

- la restauration de la zone de dépôt de fichiers de la déclaration d’événement ;
- le retour de l’icône SVG et du contour pointillé ;
- la conservation du glisser-déposer et de la sélection classique ;
- l’amélioration de l’accessibilité avec un vrai label associé au champ fichier ;
- la correction de la configuration JWT et l’augmentation de sa durée de validité ;
- la correction de la vérification d’unicité de l’adresse e-mail du profil ;
- l’harmonisation des pages, marges, titres, badges et formulaires ;
- la restauration et l’harmonisation des écrans d’authentification.
- l’invalidation serveur des JWT lors de la déconnexion grâce à la blocklist Lexik ;
- le refus de connexion admin pour les comptes supprimés, non vérifiés ou suspendus ;
- le déplacement du token d’activation dans le fragment URL, afin qu’il ne soit pas envoyé au serveur dans les requêtes de page.

Le build frontend passe actuellement. Le lint passe avec des avertissements Tailwind historiques qui devront être traités progressivement.

La déconnexion appelle maintenant `/api/auth/logout` avant de supprimer les données locales. Le serveur invalide le JWT via le cache de blocklist jusqu’à son expiration. Une déconnexion locale reste appliquée même si l’appel réseau échoue.

## Objectif d’hébergement

L’application doit fonctionner avec deux environnements séparés :

| Environnement | Branche | Usage |
|---|---|---|
| Préproduction | `dev` | Tests, validation et recette avant mise en production |
| Production | `main` | Version stable déployée sur Pulseheberge |

La branche `main` devra être protégée avec une Pull Request obligatoire, les vérifications CI obligatoires et aucun déploiement direct non validé.

## CI/CD cible

### CI sur les Pull Requests

La CI devra exécuter au minimum :

- installation reproductible des dépendances ;
- `composer validate --strict` ;
- `composer audit --locked` ;
- PHPStan ;
- PHPUnit ;
- lint frontend ;
- vérification TypeScript ;
- build Next.js ;
- tests E2E lorsque l’application est démarrée ;
- scan SAST ;
- scan des secrets ;
- scan des images Docker.

Les permissions GitHub Actions devront rester minimales :

```yaml
permissions:
  contents: read
```

Une permission d’écriture ne devra être ajoutée que pour une étape qui en a réellement besoin, par exemple la publication contrôlée d’une image.

### Déploiement `dev`

Après validation de la CI sur `dev`, le pipeline pourra :

1. construire les images ;
2. scanner les images ;
3. publier les images dans un registre privé ;
4. se connecter à Pulseheberge via une clé SSH dédiée ;
5. déployer la préproduction ;
6. lancer les vérifications de santé ;
7. exécuter le DAST sur l’URL de préproduction.

### Déploiement `main`

Après fusion validée dans `main`, le pipeline devra :

1. reconstruire les images depuis le commit fusionné ;
2. exécuter les mêmes contrôles de sécurité ;
3. publier une version immuable et identifiable ;
4. déployer la production avec approbation si possible ;
5. vérifier les endpoints de santé ;
6. conserver une procédure de retour à la version précédente.

## Contrôles de sécurité prévus

| Contrôle | Outil | Objectif | Échec du pipeline |
|---|---|---|---|
| SAST | Bearer avec `bearer-action@v2` | Détecter les problèmes dans le code | Oui selon le seuil défini |
| SCA PHP | Composer | `composer validate --strict` et `composer audit --locked` | Oui |
| SCA images | Trivy | Détecter les vulnérabilités des images | Oui pour les niveaux bloquants |
| Secrets | Gitleaks avec `gitleaks/gitleaks-action@v3` | Empêcher la fuite de secrets | Oui |
| DAST | OWASP ZAP avec `zaproxy/action-baseline@v0.15.0` | Tester l’application réellement démarrée | Oui selon le seuil défini |
| Protection réseau | Cloudflare WAF | Filtrer les requêtes malveillantes | N/A, configuration d’infrastructure |
| Anti-brute-force | Fail2ban | Bloquer les comportements répétés abusifs | N/A, configuration serveur |

Les seuils d’échec devront être explicites. Une vulnérabilité critique ou élevée ne devra pas être ignorée sans justification documentée.

## Durcissement Docker

Les images devront être revues afin de :

- utiliser des étapes de build séparées ;
- ne pas embarquer les dépendances de développement en production ;
- ne pas copier les fichiers `.env`, caches, tests ou fichiers temporaires ;
- utiliser un utilisateur non privilégié lorsque cela est compatible avec FrankenPHP ;
- supprimer les binaires inutiles de l’image finale ;
- ne pas exposer d’outils de diagnostic inutiles ;
- ajouter un scan Trivy à chaque image publiée ;
- utiliser des tags immuables liés au commit ou à la version ;
- conserver les images du registre en privé.

La suppression de binaires comme `curl` ne devra être faite qu’après vérification des healthchecks, du fonctionnement de FrankenPHP et des scripts de démarrage.

## Gestion des secrets

Les secrets ne doivent jamais être écrits dans le dépôt, les logs ou les images. La configuration de production devra utiliser des secrets montés par fichiers, notamment :

- `MYSQL_USER_FILE` ;
- `MYSQL_PASSWORD_FILE` ;
- `MYSQL_ROOT_PASSWORD_FILE` ;
- `JWT_PASSPHRASE_FILE` ;
- clés JWT montées hors de l’image ;
- clé SSH de déploiement stockée dans les secrets GitHub.

Les variables publiques du frontend devront être limitées aux valeurs réellement destinées au navigateur. Aucun secret backend ne doit utiliser un préfixe `NEXT_PUBLIC_`.

## Réduction des fuites d’informations

Avant l’hébergement, il faudra vérifier :

- désactivation des traces Symfony et de la toolbar en production ;
- absence de stack trace dans les réponses publiques ;
- absence de versions détaillées des serveurs dans les headers ;
- restriction ou désactivation de phpMyAdmin en production ;
- protection de la documentation API ;
- messages d’erreur neutres pour l’authentification ;
- logs serveur non accessibles publiquement ;
- absence de secrets dans les artefacts CI, caches et images ;
- configuration correcte de CORS, CSP, HSTS et des cookies.

## Rapports de sécurité

Chaque exécution de pipeline devra produire un artefact Markdown contenant :

- le commit analysé ;
- l’environnement ciblé ;
- les outils exécutés ;
- le statut de chaque contrôle ;
- les vulnérabilités trouvées ;
- un tableau trié par gravité ;
- la version de l’outil ;
- la correction appliquée ou la justification de l’exception ;
- la date et l’identifiant du pipeline.

## Ordre recommandé

1. Vérifier les tests actuels et stabiliser la CI existante.
2. Protéger les branches `dev` et `main`.
3. Ajouter les contrôles Composer, PHPStan, PHPUnit, lint, TypeScript et build.
4. Ajouter Bearer, Gitleaks et Trivy.
5. Construire une image de production minimale.
6. Mettre le registre d’images en privé.
7. Configurer les secrets par fichiers sur Pulseheberge.
8. Déployer la préproduction depuis `dev`.
9. Ajouter OWASP ZAP après démarrage de la préproduction.
10. Valider le déploiement production depuis `main`.
11. Configurer Cloudflare WAF, Fail2ban, sauvegardes et retour arrière.
12. Documenter les résultats et les procédures d’exploitation.

## Points restant à réaliser

- confirmer les contraintes exactes de Pulseheberge : SSH, Docker, ports, reverse proxy et certificats ;
- définir les domaines de préproduction et de production ;
- finaliser les fichiers Compose de production ;
- revoir les Dockerfiles et les utilisateurs d’exécution ;
- mettre en place les secrets par fichiers ;
- intégrer les scans dans GitHub Actions ;
- démarrer l’application dans le pipeline avant le DAST ;
- configurer les seuils de blocage ;
- tester un déploiement complet sur `dev` ;
- réaliser ensuite le déploiement contrôlé sur `main` ;
- effectuer un audit final avant ouverture publique.

## Compléments de sécurité à prévoir

La revue ciblée a également confirmé les améliorations suivantes à planifier :

- remplacer le stockage des JWT dans `localStorage` par des cookies `HttpOnly`, `Secure` et `SameSite` ;
- activer une protection CSRF adaptée si l’authentification passe par cookie ;
- ajouter une rotation de refresh tokens si les sessions longues sont nécessaires ;
- limiter les tentatives de connexion et de réinitialisation de mot de passe côté serveur ;
- rendre les tokens d’activation strictement mono-usage et plus courts ;
- ajouter une politique CSP stricte et vérifier les en-têtes de sécurité ;
- journaliser les connexions, déconnexions, échecs et changements de privilèges sans enregistrer de secrets ;
- ajouter des tests d’accès pour les comptes suspendus, supprimés et les tokens révoqués ;
- configurer une durée de conservation et une protection des logs conformes au besoin RGPD.

## Vérifications réalisées

| Vérification | Résultat |
|---|---|
| Build Next.js | Réussi |
| Lint frontend | Réussi, avertissements Tailwind historiques uniquement |
| Vérification TypeScript via le build | Réussie |
| PHPStan | Réussi, aucune erreur |
| Lint de configuration YAML Symfony | Réussi |
| Validation du conteneur Symfony | Réussie |
| Déconnexion serveur puis réutilisation du JWT | Réussi : déconnexion `200`, token révoqué `401` |
| PHPUnit ciblé | Non exécutable dans le conteneur courant : `framework.test` n’est pas activé |
