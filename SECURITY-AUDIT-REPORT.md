# Rapport d’audit sécurité applicatif

## Statut

- Date : 13 novembre 2026
- Périmètre : authentification, JWT, uploads, téléchargement de fichiers, routage frontend/API et protections anti-abus
- Type : audit de conception et de code ciblé
- Exécution de charge DDoS : non réalisée et interdite dans un environnement non autorisé

## Documentation versus artefacts CI/CD

Ce fichier et `SECURITY-CICD-ROADMAP.md` documentent le plan et les constats du projet. Ils ne sont pas les rapports d’exécution de la CI/CD.

Depuis le 15/11/2026, le job CI `security` exécute Gitleaks (tout l’historique), Trivy (dépendances et configuration, HIGH et CRITICAL) et Hadolint, génère `SECURITY-REPORT.md` avec `.github/scripts/security_report.py` et le publie avec les sorties brutes dans l’artefact `security-report` (30 jours), même en cas d’échec. Les seuils sont appliqués après la publication : tout nouveau secret, toute vulnérabilité ou configuration CRITICAL et toute erreur Hadolint font échouer le pipeline. Restent à intégrer : Bearer (SAST), SBOM et OWASP ZAP sur la préproduction.

La CI/CD devra générer un `SECURITY-REPORT.md` à partir des résultats réels de Bearer, Composer, npm, Trivy, Gitleaks, Hadolint, SBOM et OWASP ZAP, puis le publier avec `actions/upload-artifact`. Les fichiers bruts devront être joints au même artefact, sans secrets ni données utilisateurs.

Un rapport doit rester disponible même lorsqu’un scan échoue ; le pipeline devra ensuite échouer explicitement selon les seuils définis.

## Résultats

| # | Gravité | Zone | Constat | État |
|---|---|---|---|---|
| 1 | 🔴 CRITICAL | Documents uploadés | Des documents privés étaient stockés sous `public/uploads` et pouvaient être servis directement sans contrôle d’accès | Corrigé pour les nouveaux fichiers et fichiers locaux migrés |
| 2 | 🟠 HIGH | Téléchargements | Le téléchargement doit vérifier le propriétaire ou le rôle municipal autorisé | Corrigé via `/api/documents/{id}/download` |
| 3 | 🟠 HIGH | Path traversal | La stratégie de nommage et de résolution doit rester protégée contre `..`, chemins absolus et encodages | Résolution canonique et noms aléatoires ajoutés |
| 4 | 🟠 HIGH | Fichiers dangereux | Les règles d’extension, MIME réel, signature et contenu doivent être uniformisées sur tous les uploads | Corrigé pour les justificatifs, les fichiers d’événement et les images publiques (salles, matériel) |
| 5 | 🟡 MEDIUM | SVG/HTML/JS | Ces formats peuvent contenir du contenu actif et ne doivent pas être servis inline | À interdire ou sanitiser |
| 6 | 🟡 MEDIUM | Déni de service applicatif | Les tailles, nombres de fichiers, temps et quotas doivent être limités par endpoint | À ajouter |
| 7 | 🟡 MEDIUM | JWT navigateur | Le stockage `localStorage` reste exposé à une compromission XSS | Migration cookies sécurisés à planifier |
| 8 | 🟠 HIGH | Cache des téléchargements | `BinaryFileResponse` renvoyait `Cache-Control: public` : un proxy ou un CDN pouvait conserver un justificatif privé | Corrigé (`private, no-store`) pour les justificatifs et les fichiers d’événement |
| 9 | 🟡 MEDIUM | Téléchargements | Documents supprimés logiquement encore téléchargeables, `Content-Type` repris sans contrôle, erreur 500 sur un nom contenant `\` | Corrigé et testé |
| 10 | 🔴 CRITICAL | Persistance | `var/uploads` n’était monté sur aucun volume en production : chaque redéploiement aurait effacé les justificatifs et fichiers d’événement | Corrigé (volume `backend_private_uploads`, uploads exclus des images) |
| 11 | 🟡 MEDIUM | Historique Git | Gitleaks relève une ancienne clé JWT chiffrée (septembre) et un `APP_SECRET` de développement dans l’historique ; aucune n’est en service, la production utilise ses propres clés | Analysé ; empreintes listées dans `.gitleaksignore`, nouvelles fuites bloquantes en CI |
| 12 | 🟡 MEDIUM | Image backend | L’image FrankenPHP s’exécute en `root` (Trivy DS-0002, HIGH) | À traiter : utilisateur non privilégié avec capacité de liaison aux ports 80/443 |

## Mesures obligatoires pour les uploads

1. Déplacer les fichiers privés hors de `public/`.
2. Générer les noms de fichiers côté serveur.
3. Vérifier la résolution canonique du chemin.
4. Appliquer une allowlist métier par endpoint.
5. Vérifier taille, MIME détecté et signature binaire.
6. Refuser les fichiers exécutables, scripts, HTML, archives et SVG actif.
7. Ajouter `nosniff` et `Content-Disposition: attachment`.
8. Vérifier l’autorisation avant chaque téléchargement.
9. Ajouter quotas, rate limiting et nettoyage des fichiers temporaires.
10. Ajouter un antivirus si l’hébergement le permet.

### Implémentation réalisée

- `PrivateDocumentStorage` est utilisé par les justificatifs d’association, de salle et de matériel.
- Les fichiers sont stockés dans `var/uploads/documents`, hors racine web.
- Les URLs renvoyées au frontend sont des endpoints API authentifiés ; le frontend télécharge avec le JWT au lieu d’ouvrir une URL publique.
- Caddy refuse les anciens chemins publics de documents.

## Plan de tests

Les tests PHPUnit devront couvrir :

- upload sans authentification ;
- upload par une association non autorisée ;
- fichier trop volumineux ;
- extension interdite ;
- MIME falsifié ;
- fichier vide ou corrompu ;
- nom contenant `../` ;
- chemin absolu ;
- variantes encodées de `..` ;
- téléchargement d’un document d’une autre association ;
- absence de fuite du chemin réel ;
- en-têtes sûrs de téléchargement ;
- token JWT révoqué ;
- compte suspendu, supprimé ou non vérifié.

Les tests doivent utiliser de petits fichiers synthétiques. Aucun test de DDoS réel ne doit être lancé.

### Tests réalisés (15/11/2026)

`backend/tests/Controller/DocumentControllerTest.php` couvre le téléchargement : authentification, propriétaire, autre association, mairie, document inconnu ou supprimé, fichier absent, path traversal (`../`, `..\`, `%2e%2e`, chemin absolu, lien symbolique), absence de fuite du chemin réel, en-têtes sûrs et nom de fichier assaini. `backend/tests/Controller/ExternalEventControllerTest.php` couvre les fichiers d’événement : authentification sur les trois routes, administrateur et agent événement autorisés, agent d’un autre module et association refusés en `403` sur la route mairie, association propriétaire autorisée, autre association `404`, fichier absent, path traversal, MIME et nom assainis, cache privé. Les tests d’upload sont réalisés : `backend/tests/Unit/Service/PrivateDocumentStorageTest.php`, `backend/tests/Unit/Service/SecureEventFileStorageTest.php` et `backend/tests/Controller/AssociationRequestDocumentUploadTest.php` couvrent la taille, le MIME falsifié, les signatures, les contenus HTML/JS/PHP/SVG/ZIP déguisés, les fichiers vides ou corrompus, les noms invalides et les droits d’accès. Ils ont révélé des fichiers orphelins et l’acceptation de caractères de contrôle dans les noms de fichiers d’événement, désormais corrigés.

## Outils proposés

- Bearer et Semgrep : SAST ;
- Composer audit et npm audit : dépendances applicatives ;
- Trivy : images et vulnérabilités système ;
- Hadolint et Dockle : Dockerfiles et images ;
- Syft et Grype : SBOM et vulnérabilités ;
- Gitleaks : secrets ;
- OWASP ZAP : DAST sur préproduction ;
- Nuclei : contrôles ciblés et maîtrisés de l’exposition ;
- ClamAV : analyse antivirus des fichiers, si disponible sur Pulseheberge ;
- Cloudflare WAF : protection réseau et rate limiting ;
- Fail2ban : SSH et événements d’authentification.

## Règles d’échec CI

- secret détecté : échec immédiat ;
- vulnérabilité critique : échec immédiat ;
- vulnérabilité élevée exploitable : échec par défaut ;
- Dockerfile non conforme : échec après adoption d’Hadolint ;
- test de sécurité régressif : échec ;
- vulnérabilités moyennes : rapport et correction planifiée selon le risque ;
- résultats non vérifiables : échec ou blocage, jamais succès silencieux.

## Prochaine tâche d’implémentation

La prochaine tâche CI/CD devra créer le script de génération du rapport et intégrer `actions/upload-artifact` dans les workflows. Ensuite, le stockage et le téléchargement des documents privés devront être sécurisés avec les tests PHPUnit correspondants. Les deux rapports Markdown devront être mis à jour avec les fichiers modifiés et les commandes réellement exécutées.
