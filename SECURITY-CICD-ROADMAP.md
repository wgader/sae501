# Rapport de finalisation et feuille de route sécurité

> Document de suivi à mettre à jour à la fin de chaque tâche technique.

## Dernière mise à jour

- Date : 13 novembre 2026
- Statut : architecture cible F+B choisie ; sécurisation CI/CD à poursuivre
- Prochaine étape : intégrer la génération de rapports Markdown comme artefacts CI/CD

## Réalisé

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
- le stockage privé centralisé des justificatifs dans `var/uploads/documents`, avec validation de taille, MIME, signature et nom ;
- le téléchargement authentifié des justificatifs via `/api/documents/{id}/download`, avec contrôle propriétaire/mairie et en-têtes `attachment`/`nosniff` ;
- le blocage Caddy des anciens chemins publics `/uploads/documents/*` et la migration des fichiers locaux existants hors de `public/`.

Le build frontend passe actuellement. Le lint passe avec des avertissements Tailwind historiques qui devront être traités progressivement.

La déconnexion appelle maintenant `/api/auth/logout` avant de supprimer les données locales. Le serveur invalide le JWT via le cache de blocklist jusqu’à son expiration. Une déconnexion locale reste appliquée même si l’appel réseau échoue.

La commande `php bin/phpunit` force désormais l’environnement Symfony `test`, même lorsque le conteneur Docker utilise `APP_ENV=dev`. La CI utilise ce lanceur afin d’éviter les faux échecs liés à la configuration de l’environnement.

### Validation de la tâche actuelle

- PHPUnit ciblé `DocumentControllerTest` : 1 test, 1 assertion — réussi.
- Suite PHPUnit backend précédemment validée : 64 tests, 300 assertions — réussie.
- PHPStan — réussi.
- Build frontend — réussi.
- Lint frontend — réussi avec des avertissements Tailwind historiques.
- Configuration Symfony et conteneur — validés après injection de `PrivateDocumentStorage`.
- Révocation JWT testée : logout `200`, réutilisation du token `401`.
- Tests ajoutés pour la révocation JWT, le logout non authentifié et les comptes mairie suspendus, supprimés ou non vérifiés.
- Vérification de l’architecture Docker actuelle réalisée et écarts avec le schéma du cours documentés ci-dessous.
- `git diff --check` — réussi.
- Migration locale des deux documents existants vers `backend/var/uploads/documents` — réussie.
- La relance des tests JWT a révélé une clé privée de test locale chiffrée avec
  une passphrase incorrecte (`bad decrypt`) ; la correction de la configuration
  des clés de test reste nécessaire avant de déclarer la suite complète verte.

## À faire

Les sections suivantes décrivent le travail restant et ne constituent pas encore des fonctionnalités réalisées.

### Objectif d’hébergement

L’application doit fonctionner avec deux environnements séparés :

| Environnement | Branche | Usage |
|---|---|---|
| Préproduction | `dev` | Tests, validation et recette avant mise en production |
| Production | `main` | Version stable déployée sur Pulseheberge |

La branche `main` devra être protégée avec une Pull Request obligatoire, les vérifications CI obligatoires et aucun déploiement direct non validé.

### CI/CD cible

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

### Contrôles de sécurité prévus

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

### Outils complémentaires à étudier

En complément de Bearer, Composer, npm, Trivy, Gitleaks et OWASP ZAP, les outils suivants peuvent renforcer la chaîne :

| Outil | Usage | Intégration prévue |
|---|---|---|
| Semgrep | SAST complémentaire avec règles PHP/TypeScript | Pull Requests, seuil bloquant à définir |
| Hadolint | Analyse des Dockerfiles | Pull Requests et build image |
| Dockle | Contrôle des bonnes pratiques des images | Après le build |
| Syft | Génération d’un SBOM des images | Artefact de release |
| Grype | Scan du SBOM et des dépendances système | Après Syft, en complément de Trivy |
| OWASP Dependency-Check | Analyse complémentaire des dépendances | À évaluer, éviter les doublons inutiles |
| Nuclei | Vérifications ciblées de l’environnement exposé | Préproduction uniquement, avec templates maîtrisés |
| `npm run scan` | Script projet regroupant les contrôles frontend | À ajouter seulement s’il exécute des outils installés et reproductibles |

Il ne faut pas empiler des outils sans seuils ni traitement des résultats. Chaque outil retenu devra avoir un objectif distinct, une version maîtrisée et une règle d’échec documentée.

### Durcissement Docker

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

### Analyse de l’architecture Docker actuelle

Des éléments demandés par le cours sont déjà présents :

- le Dockerfile frontend utilise un build multi-stage `deps` → `builder` → `runner` ;
- le runner frontend n’embarque pas les sources et dépendances de développement inutiles ;
- l’utilisateur `nextjs` n’est pas root dans le runner frontend ;
- le Compose de production sépare `app_network` et `db_network` ;
- `db_network` est marqué `internal: true` ;
- MySQL n’est pas publié vers l’extérieur dans `docker-compose.prod.yml` ;
- les clés JWT de production sont montées via des secrets Docker ;
- les images de production sont séparées du Compose de développement ;
- le frontend de production est lancé en mode Next.js standalone.

Les écarts ou points à vérifier sont :

- le backend n’a pas encore un vrai multi-stage builder/runner séparé ;
- l’image backend utilise déjà Alpine, mais elle doit être durcie sans supprimer un binaire utilisé par un healthcheck ou un script ;
- les images utilisent encore des tags par défaut `latest`, ce qui n’est pas immuable ;
- le registre GHCR doit être configuré en privé et les permissions `packages` limitées au job de publication ;
- le Compose de développement publie MySQL, phpMyAdmin, Mailpit et le backend directement sur l’hôte ;
- phpMyAdmin et Mailpit ne doivent jamais être exposés en production ;
- le frontend et le backend sont encore deux services de production, contrairement à l’option du cours “une image F+B” ;
- le backend FrankenPHP sert actuellement l’API, mais un reverse proxy Nginx externe n’est pas encore présent ;
- la règle “le backend sert le frontend” nécessiterait de produire le frontend statique puis de le copier dans l’image du runner backend ;
- la compatibilité exacte entre Nginx externe, FrankenPHP/Caddy interne et HTTPS doit être décidée avant modification ;
- les variables `MYSQL_*_FILE` sont prévues dans la feuille de route mais ne sont pas encore câblées dans tous les services.

### Alpine, image hardened et absence de shell

Alpine réduit la taille de l’image, mais ne rend pas automatiquement l’application sécurisée. Il faut vérifier :

- les extensions PHP et leurs dépendances système ;
- les certificats CA nécessaires aux appels sortants ;
- les commandes des healthchecks ;
- les migrations et scripts de démarrage ;
- les besoins de diagnostic en préproduction ;
- l’exécution sous un utilisateur non privilégié ;
- l’absence de shell et de package manager uniquement dans le runner final, pas dans le builder.

Le modèle cible est :

```dockerfile
FROM image-de-build AS builder
# installation des dépendances et compilation

FROM image-hardened AS runner
# copie uniquement des artefacts nécessaires depuis builder
COPY --from=builder ...
```

Le runner ne doit contenir ni compilateur, ni gestionnaire de paquets, ni outils de debug inutiles. Une image “distroless” ou sans shell ne devra être utilisée qu’après validation des healthchecks, du démarrage FrankenPHP et des besoins d’administration.

### Réseaux et exposition des services

L’architecture cible à documenter est :

```text
Internet
   |
Cloudflare WAF / VPN / reverse proxy Nginx
   | 80/443 uniquement
Network Front
   |
Application (frontend + API, ou frontend séparé selon décision)
   |
Network Back interne
   |                 |
MySQL          outils d’administration
               accessibles uniquement par VPN/SSH
```

Règles prévues :

- aucun port MySQL publié en production ;
- aucun port phpMyAdmin publié publiquement ;
- aucun port Mailpit publié en production ;
- accès administration par VPN WireGuard ou tunnel SSH ;
- mode `bridge` pour les réseaux Docker applicatifs ;
- mode `host` à éviter, sauf besoin explicitement justifié par l’hébergeur ;
- segmentation frontend/backend/DB avec règles minimales ;
- seules les connexions nécessaires entre réseaux doivent être autorisées ;
- accepter les connexions d’administration uniquement depuis la machine ou le réseau autorisé.

### Reverse proxy et choix d’architecture

Le schéma du cours place Nginx devant l’application. Le projet utilise actuellement Caddy intégré à FrankenPHP pour l’API et un serveur Next.js standalone pour le frontend. Deux architectures sont possibles :

1. **Images séparées** : Nginx en frontal, frontend et backend séparés, DB sur réseau interne. Cette option conserve mieux la séparation actuelle et facilite les mises à jour indépendantes.
2. **Image unique F+B** : build Next.js statique, copie de `dist` dans l’image backend, puis Nginx/FrankenPHP sert le frontend et l’API. Cette option correspond davantage au schéma du cours mais augmente le couplage et nécessite de revoir le routage Next.js.

#### Décision retenue

L’architecture **image unique F+B** est retenue :

- le frontend sera construit dans un stage dédié ;
- le backend sera construit dans un stage dédié ;
- seuls les artefacts nécessaires seront copiés dans le runner final ;
- le reverse proxy externe terminera HTTPS et enverra les requêtes vers l’image applicative ;
- l’image finale devra servir le frontend et l’API sans exposer MySQL ;
- le fonctionnement exact de FrankenPHP/Caddy devra être conservé ou remplacé par Nginx, mais un seul composant devra être responsable du routage et du TLS.

Avant l’implémentation, il faut vérifier si Next.js peut être exporté statiquement. Si certaines routes nécessitent le serveur Next.js, une image unique avec deux processus serait nécessaire et devra être évitée ou supervisée proprement. Cette vérification est bloquante pour le Dockerfile final.

### Routage frontend/API attendu

L’explication du cours correspond à une application servie depuis une origine unique :

| Chemin navigateur | Destination |
|---|---|
| `/`, `/connexion`, `/admin/...` | Frontend |
| `/api/...` | API Symfony |
| `/uploads/...` | Fichiers servis par l’application |

Le frontend doit donc appeler :

```ts
fetch('/api/account/profile')
fetch('/api/auth/login')
```

et non construire en production une URL avec `http://localhost`, un port Docker ou un domaine API séparé.

#### État actuel

Le backend expose déjà l’API sous le préfixe `/api`, et la majorité des modules frontend utilisent des chemins commençant par `/api/...`. Cependant, la primitive HTTP ajoute encore `NEXT_PUBLIC_API_URL` devant ces chemins. Plusieurs écrans utilisent aussi directement cette variable, notamment la connexion, l’activation, le logout et certains téléchargements.

La configuration actuelle utilise donc encore deux modèles :

- chemins API relatifs dans les modules ;
- préfixe absolu `NEXT_PUBLIC_API_URL` dans le client HTTP et plusieurs composants.

Ce mélange devra être supprimé pour l’image unique.

#### Cible de configuration

Pour l’architecture F+B :

1. le navigateur appelle uniquement `/api/...` et `/uploads/...` ;
2. aucune valeur `localhost` ou port de développement ne doit être injectée dans le build de production ;
3. le reverse proxy ou FrankenPHP route `/api` vers Symfony ;
4. le même serveur sert les pages frontend ;
5. les appels frontend restent sur la même origine, ce qui simplifie CORS et réduit les risques de mauvaise configuration ;
6. `NEXT_PUBLIC_API_URL` devient inutile en production, ou doit être réservé au développement local ;
7. les URLs d’email doivent utiliser le domaine public réel, jamais une URL interne Docker.

#### Point d’attention Next.js

`output: 'standalone'` produit actuellement un serveur Next.js, tandis que le schéma du cours parle d’un frontend statique copié dans l’image backend. Il ne faut pas remplacer automatiquement `standalone` par `export` :

- des routes dynamiques peuvent nécessiter une génération statique explicite ;
- les redirections et réécritures doivent être adaptées ;
- les appels API côté navigateur doivent rester relatifs ;
- le serveur qui sert les fichiers statiques doit gérer correctement les routes frontend ;
- une exportation statique ne doit pas exposer une API ou des secrets au build.

La prochaine vérification doit donc tester l’export statique sur une branche de travail, puis contrôler les routes générées et les appels `/api`. Si l’export casse des routes, il faudra conserver un runtime Next.js dans l’image unique et organiser proprement le service frontend/backend, plutôt que produire une image incorrecte.

### Scheduler de campagnes

Le service `campaign-scheduler` actuel n’est pas un scheduler GitHub Actions. C’est un conteneur permanent qui exécute :

```sh
while true; do
  php bin/console app:campaigns:synchronize --env=prod --no-interaction
  sleep 60
done
```

Il sert à synchroniser les campagnes toutes les 60 secondes dans l’environnement Docker. Ce fonctionnement consomme un conteneur en permanence et ne fournit pas une planification Linux native.

Options à comparer :

- cron ou systemd timer sur le serveur ;
- tâche planifiée de l’hébergeur ;
- worker dédié supervisé ;
- scheduler externe déclenchant une commande protégée ;
- GitHub Actions `schedule` uniquement pour une tâche non sensible et non dépendante du réseau privé.

GitHub Actions `schedule` n’est pas équivalent à un cron fiable de production : il peut être retardé, dépend de GitHub et ne doit pas recevoir les secrets ou accès internes sans justification. Pour une synchronisation applicative, un cron/systemd sur Pulseheberge ou un worker dédié est généralement plus cohérent.

### Rebuild périodique des images

Un workflow GitHub Actions planifié pourra reconstruire les images régulièrement afin d’intégrer les mises à jour de l’image de base et les correctifs système. Il devra :

- être séparé du déploiement ;
- utiliser des permissions en lecture seule sauf publication nécessaire ;
- reconstruire sans utiliser de secrets applicatifs ;
- scanner les images avec Trivy ;
- publier uniquement dans le registre privé avec un tag immuable ;
- ne pas déployer automatiquement en production sans validation ;
- produire un rapport Markdown d’artefact.

Ce rebuild périodique ne remplace pas Dependabot, Composer audit, npm audit ou les scans de chaque Pull Request.

### CI/CD cible selon le cours

Le pipeline devra documenter et vérifier :

1. build Next.js statique ou standalone selon l’architecture retenue ;
2. conservation du résultat comme artefact si le frontend est séparé ;
3. build backend `/var/www` ou `/app` ;
4. build multi-stage et runner hardened ;
5. scan applicatif via `npm run scan` s’il est ajouté au projet ;
6. audit Composer et npm ;
7. scan des secrets ;
8. scan des images ;
9. démarrage de l’application avant les tests E2E et DAST ;
10. publication privée et déploiement contrôlé.

La recommandation “mot de passe root MySQL aléatoire” devra être appliquée par secret généré hors du dépôt, puis injecté via secret Docker ou gestionnaire de secrets. Un mot de passe présent dans `.env.example`, les logs ou la commande Docker n’est pas acceptable.

### Gestion des secrets

Les secrets ne doivent jamais être écrits dans le dépôt, les logs ou les images. La configuration de production devra utiliser des secrets montés par fichiers, notamment :

- `MYSQL_USER_FILE` ;
- `MYSQL_PASSWORD_FILE` ;
- `MYSQL_ROOT_PASSWORD_FILE` ;
- `JWT_PASSPHRASE_FILE` ;
- clés JWT montées hors de l’image ;
- clé SSH de déploiement stockée dans les secrets GitHub.

Les variables publiques du frontend devront être limitées aux valeurs réellement destinées au navigateur. Aucun secret backend ne doit utiliser un préfixe `NEXT_PUBLIC_`.

### Réduction des fuites d’informations

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

### Uploads et fichiers : exigences de sécurité

La revue dédiée a identifié un risque critique de confidentialité : les documents d’association sont actuellement placés sous `public/uploads` et peuvent être servis directement par FrankenPHP/Caddy, sans passer par une autorisation métier.

Avant l’hébergement, tous les endpoints d’upload et de téléchargement devront appliquer les contrôles suivants :

- stocker les documents privés hors de `public/` ;
- servir les fichiers uniquement via un endpoint authentifié et autorisé ;
- vérifier que l’association propriétaire, l’agent habilité ou l’administrateur demande le document ;
- ne jamais utiliser le nom fourni par l’utilisateur comme chemin de stockage ;
- générer un nom aléatoire côté serveur ;
- utiliser `basename` et une résolution de chemin canonique pour empêcher le path traversal ;
- refuser les chemins absolus, `..`, séparateurs inattendus et caractères de contrôle ;
- limiter la taille de chaque fichier et la taille totale d’une requête ;
- limiter le nombre de fichiers par requête et par utilisateur ;
- vérifier l’extension autorisée, le type MIME détecté et la signature réelle du fichier ;
- ne jamais faire confiance à `Content-Type`, au nom ou à l’extension seuls ;
- refuser par défaut HTML, JavaScript, PHP, SVG actif, fichiers XML dangereux, archives et fichiers polyglottes ;
- si SVG nécessaire, le sanitiser avec une bibliothèque spécialisée et le servir en téléchargement forcé, jamais inline ;
- servir les fichiers avec `Content-Disposition: attachment`, un `Content-Type` sûr et `X-Content-Type-Options: nosniff` ;
- empêcher l’exécution de scripts dans le répertoire de stockage ;
- analyser les fichiers avec un antivirus ou ClamAV si les contraintes Pulseheberge le permettent ;
- supprimer les fichiers temporaires en cas d’échec ;
- journaliser l’identifiant du fichier et l’utilisateur, jamais le contenu ni un token ;
- prévoir une tâche de nettoyage des fichiers orphelins ;
- tester les erreurs de taille, de type, d’autorisation, de chemin et de fichier corrompu.

Les mêmes contrôles doivent être appliqués aux documents d’association, justificatifs de réservation, annexes d’événements, images de salles et tout nouvel endpoint d’upload.

### Tests de sécurité uploads et anti-abus

Une suite dédiée devra vérifier au minimum :

| Cas | Résultat attendu |
|---|---|
| fichier PHP, HTML, JS ou SVG actif | rejet `4xx` |
| extension falsifiée avec contenu différent | rejet `4xx` |
| fichier trop volumineux | rejet `413` ou réponse métier équivalente |
| trop de fichiers ou requête trop lourde | rejet et journalisation contrôlée |
| nom `../../secret.txt` | aucun accès hors du répertoire prévu |
| chemin absolu ou encodage de `..` | rejet |
| téléchargement sans authentification | `401` |
| téléchargement par une autre association | `403` ou `404` neutre |
| document inexistant | `404` sans révéler le chemin disque |
| réponse fichier | `nosniff`, disposition et type sûrs |
| fichier corrompu ou vide | rejet selon la règle métier |

Les tests ne doivent pas envoyer de charge de déni de service réelle. Les limites de taille, de temps, de débit et de concurrence doivent être testées avec de petites charges contrôlées.

### Script de contrôle local prévu

Un script reproductible pourra regrouper les contrôles locaux sans secrets :

```sh
#!/bin/sh
set -eu

composer validate --strict --working-dir=backend
composer audit --locked --working-dir=backend
npm audit --prefix frontend
npm run lint --prefix frontend
npm run build --prefix frontend
docker build --file docker/backend/Dockerfile --tag sae501/backend:security-check .
docker build --file docker/frontend/Dockerfile --tag sae501/frontend:security-check .
trivy image --severity HIGH,CRITICAL --exit-code 1 sae501/backend:security-check
trivy image --severity HIGH,CRITICAL --exit-code 1 sae501/frontend:security-check
gitleaks detect --redact --exit-code 1
```

Le script réel devra être ajouté seulement après validation des commandes disponibles dans la CI. Le DAST ne doit pas être exécuté contre une application arrêtée : il nécessitera un démarrage contrôlé de la stack, des données de test non sensibles et une URL de préproduction.

### Limites anti-DDoS et anti-abus

La protection doit être répartie par couches :

- Cloudflare WAF et rate limiting en frontal ;
- limites de requêtes et de taille dans Nginx ou le reverse proxy ;
- limites PHP/Symfony (`post_max_size`, `upload_max_filesize`, temps d’exécution) ;
- rate limiting Symfony sur login, activation, reset password, contact et uploads ;
- Fail2ban sur SSH et logs d’authentification ;
- quotas par utilisateur pour les fichiers et demandes ;
- timeouts et limites de concurrence côté serveur ;
- aucune exposition publique de MySQL, phpMyAdmin ou Mailpit ;
- monitoring CPU, mémoire, disque, connexions et espace uploads ;
- procédure d’alerte, sauvegarde et restauration.

Un DDoS volumétrique ne peut pas être résolu uniquement dans le code ou Docker : il nécessite une protection réseau en amont et une configuration adaptée de Pulseheberge/Cloudflare.

### Rapports de sécurité

Les fichiers `SECURITY-CICD-ROADMAP.md` et `SECURITY-AUDIT-REPORT.md` sont la documentation de référence du dépôt. Ils expliquent le plan, les règles et les constats connus, mais ils ne remplacent pas les rapports générés par les pipelines.

Actuellement, les workflows [ci.yml](./.github/workflows/ci.yml) et [cd.yml](./.github/workflows/cd.yml) ne publient pas encore de rapport Markdown comme artefact. Cette fonctionnalité reste donc à implémenter.

Chaque exécution de pipeline devra produire et téléverser un dossier d’artefacts contenant au minimum :

- le commit analysé ;
- l’environnement ciblé ;
- les outils exécutés ;
- le statut de chaque contrôle ;
- les vulnérabilités trouvées ;
- un tableau trié par gravité ;
- la version de l’outil ;
- la correction appliquée ou la justification de l’exception ;
- la date et l’identifiant du pipeline.

Les rapports devront être générés automatiquement à partir des sorties réelles des commandes, et non copiés manuellement depuis le Markdown du dépôt.

#### Artefacts attendus par la CI

La CI devra publier, avec `actions/upload-artifact`, un artefact par exécution, par exemple `security-report-${{ github.run_id }}`, comprenant :

```text
security-reports/
├── SECURITY-REPORT.md
├── composer-audit.txt
├── npm-audit.json
├── phpstan.txt
├── phpunit.txt
├── frontend-lint.txt
├── gitleaks.json
├── trivy-backend.json
├── trivy-frontend.json
├── bearer.json
├── hadolint.txt
├── zap-report.md
└── sbom/
```

Le fichier `SECURITY-REPORT.md` devra être généré par un script CI dédié et contenir :

1. l’identifiant du workflow, du job et du commit ;
2. la branche ou le tag analysé ;
3. les versions de PHP, Node, Composer, npm et des outils ;
4. un tableau des contrôles avec statut `PASS`, `FAIL` ou `NOT RUN` ;
5. un tableau des vulnérabilités trié `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` ;
6. les chemins ou identifiants concernés ;
7. les commandes exécutées et leur code retour ;
8. les artefacts bruts associés ;
9. les exceptions approuvées et leur date d’expiration ;
10. la conclusion du pipeline.

Les sorties peuvent être conservées même lorsqu’une analyse échoue. Le job devra capturer les résultats, générer le rapport, téléverser les artefacts, puis échouer explicitement si le seuil de sécurité est dépassé. Il ne faut pas masquer un échec avec `|| true` sans enregistrer le code retour.

#### Rapports CD et DAST

Le pipeline CD devra produire un rapport séparé après :

- le build des images ;
- le scan Trivy des images finales ;
- la génération du SBOM ;
- le démarrage de la préproduction ;
- les healthchecks ;
- le scan OWASP ZAP ;
- les vérifications post-déploiement.

Les rapports DAST et de déploiement ne doivent jamais contenir de secrets, tokens, mots de passe, cookies de session ou contenus de fichiers utilisateurs.

#### Permissions GitHub Actions

Le job qui génère et téléverse les rapports doit utiliser uniquement :

```yaml
permissions:
  contents: read
  actions: write
```

Cette permission `actions: write` devra être vérifiée selon la version de `upload-artifact`. Aucun job de scan ne doit recevoir `packages: write`, `contents: write` ou des secrets de déploiement. Seul le job de publication d’images ou de déploiement peut obtenir les droits supplémentaires strictement nécessaires.

### Ordre recommandé

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

### Checklist des tâches restantes

- corriger le stockage public des documents et créer le téléchargement autorisé ;
- ajouter les tests path traversal, MIME, extensions, tailles, quotas et autorisations ;
- décider si SVG est interdit ou sanitizé puis téléchargé en pièce jointe ;
- auditer tous les endpoints d’upload existants ;
- ajouter les limites anti-abus et rate limiting ;
- choisir les outils complémentaires réellement utiles ;
- écrire le script de scan local puis le réutiliser dans GitHub Actions ;
- créer le script de génération `SECURITY-REPORT.md` à partir des sorties des outils ;
- ajouter `actions/upload-artifact` à la CI ;
- ajouter les rapports d’audit des dépendances, SAST, secrets, images, SBOM et DAST aux artefacts ;
- vérifier que les rapports sont disponibles après un échec de scan ;
- exclure systématiquement les secrets et données utilisateurs des artefacts ;
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

### Compléments de sécurité à prévoir

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

### Tests de sécurité ajoutés

- `LogoutControllerTest` vérifie que le logout exige une authentification.
- `LogoutControllerTest` vérifie qu’un JWT est rejeté après sa révocation.
- `AdminAuthControllerTest` vérifie qu’un compte mairie suspendu ne peut pas se connecter.
- `AdminAuthControllerTest` vérifie qu’un compte mairie supprimé ne peut pas se connecter.
- `AdminAuthControllerTest` vérifie qu’un compte mairie non vérifié ne peut pas se connecter.
- Chaque cas vérifie le statut HTTP `403` et l’absence de token dans la réponse.

## Historique des tâches

| Date | Tâche | Résultat |
|---|---|---|
| 13/11/2026 | Correction du dépôt de fichiers événement | SVG, contour pointillé, glisser-déposer et accessibilité restaurés |
| 13/11/2026 | Révocation JWT à la déconnexion | Blocklist Lexik activée ; token réutilisé rejeté en `401` |
| 13/11/2026 | Contrôle des comptes mairie | Comptes supprimés, non vérifiés ou suspendus refusés |
| 13/11/2026 | Protection du token d’activation | Token placé dans le fragment URL pour les nouveaux liens |
| 13/11/2026 | Stabilisation PHPUnit | Lanceur forcé en environnement `test` ; 59 tests réussis |
| 13/11/2026 | Tests de sécurité d’authentification | 7 tests ciblés réussis ; 64 tests backend au total |
| 13/11/2026 | Analyse Docker et architecture de cours | Multi-stage frontend et réseaux internes confirmés ; écarts backend, proxy, exposition et scheduler documentés |
| 13/11/2026 | Choix d’architecture cible | Image unique frontend + backend retenue ; compatibilité de l’export statique à vérifier avant implémentation |
| 13/11/2026 | Clarification du routage F+B | Cible `/` frontend, `/api/...` Symfony et `/uploads/...` ; suppression future des URLs absolues `localhost`/ports en production |
| 13/11/2026 | Audit uploads et fichiers | Risque HIGH confirmé : documents privés exposés sous `public/uploads` ; contrôles path traversal, MIME, taille, SVG et anti-abus ajoutés à la feuille de route |
| 13/11/2026 | Clarification des rapports CI/CD | Les Markdown du dépôt documentent le plan ; `SECURITY-REPORT.md` et les sorties brutes devront être générés puis téléversés comme artefacts de chaque pipeline |
| 13/11/2026 | Mise à jour du suivi | Sections Réalisé / À faire et validations ajoutées à ce document |
