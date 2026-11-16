# Déploiement de SAE501 sur un VPS

Ce guide décrit la mise en service et l’exploitation de la préproduction et de la production sur
un seul VPS (Pulseheberge, Debian 12 ou Ubuntu 24.04), déployées par GitHub Actions via SSH.

## Vue d’ensemble

```text
Internet ──80/443──> sae501-edge (Caddy, TLS Let’s Encrypt)
                       │ réseau sae501-preprod_edge      │ réseau sae501-prod_edge
                       ▼                                 ▼
              sae501-preprod (Compose)          sae501-prod (Compose)
              frontend · backend                frontend · backend
              messenger-worker · scheduler      messenger-worker · scheduler
              mysql (réseau interne)            mysql (réseau interne)
```

| | Préproduction | Production |
|---|---|---|
| Branche | `develop` (chaque push) | `main` (chaque push), ou un tag via « Run workflow » |
| Environnement GitHub | `preprod` | `production` (approbation recommandée) |
| Dossier serveur | `/srv/sae501/preprod` | `/srv/sae501/prod` |
| Projet Compose | `sae501-preprod` | `sae501-prod` |
| Volumes, réseaux | `sae501-preprod_*` | `sae501-prod_*` |

- Les deux environnements ont leurs propres `.env`, mots de passe, base, volumes, clés JWT et clé
  Brevo. Les noms des volumes et réseaux sont dérivés de `COMPOSE_PROJECT_NAME` et `deploy.sh`
  refuse un `.env` dont le projet ne correspond pas au dossier.
- Seul le proxy d’entrée `sae501-edge` publie des ports (80/443). Il est nécessaire parce que les
  deux environnements partagent la même machine : aucun backend ne peut écouter seul sur 443.
  La préproduction et la production ne sont jamais sur un même réseau Docker.
- MySQL est sur un réseau interne sans accès extérieur. phpMyAdmin et Mailpit n’existent que dans
  `docker-compose.yml` (développement) et ne sont jamais déployés.
- Les images sont publiées sur GHCR avec le SHA du commit comme étiquette (jamais `latest`) :
  `ghcr.io/wgader/sae501/backend:<sha>` et `ghcr.io/wgader/sae501/frontend:<sha>-<preprod|prod>`
  (l’URL de l’API est figée dans le bundle Next.js, d’où une image frontend par environnement).

Fichiers concernés :

| Fichier | Rôle |
|---|---|
| `docker-compose.prod.yml` | pile d’un environnement |
| `.env.preprod.example`, `.env.prod.example` | modèles commentés des `.env` du serveur (sans valeur réelle) |
| `docker/deploy/bootstrap-server.sh` | mise en service du VPS (root, idempotent) |
| `docker/deploy/deploy.sh` | déploiement, retour arrière, état (utilisateur `deploy`) |
| `docker/deploy/backup.sh` | sauvegardes quotidiennes et restaurations |
| `docker/deploy/edge/` | proxy d’entrée Caddy commun |
| `.github/workflows/cd.yml` | construction, analyse, publication et déploiement |

## 1. Prérequis

### DNS

Créer quatre enregistrements `A` (et `AAAA` si le VPS a une IPv6) vers l’adresse du VPS, par
exemple :

| Nom | Usage |
|---|---|
| `www.<domaine>` | frontend de production |
| `api.<domaine>` | API de production |
| `preprod.<domaine>` | frontend de préproduction |
| `api.preprod.<domaine>` | API de préproduction |

Les certificats sont obtenus automatiquement par Caddy dès que les noms résolvent vers le VPS et
que les ports 80/443 sont joignables. Les noms sont modifiables : ils ne sont écrits que dans les
`.env` du serveur et dans les variables GitHub.

### Clé SSH de déploiement

Sur un poste de confiance, générer une clé dédiée à la CD, sans phrase de passe (elle n’est stockée
que dans les secrets GitHub) :

```bash
ssh-keygen -t ed25519 -C github-actions-sae501 -f sae501_deploy -N ''
```

`sae501_deploy.pub` est donnée au script de mise en service ; `sae501_deploy` (privée) va dans le
secret `DEPLOY_SSH_KEY`, puis le fichier local est supprimé.

## 2. Première mise en service du serveur

Copier les scripts sur le VPS (depuis une copie du dépôt), puis lancer la mise en service en root :

```bash
scp -r docker/deploy root@<vps>:/root/sae501-deploy
```

```bash
ssh root@<vps>
```

```bash
DEPLOY_PUBLIC_KEY="$(cat /root/sae501-deploy/sae501_deploy.pub)" \
ACME_EMAIL=admin@<domaine> \
PROD_FRONTEND_DOMAIN=www.<domaine> PROD_API_DOMAIN=api.<domaine> \
PREPROD_FRONTEND_DOMAIN=preprod.<domaine> PREPROD_API_DOMAIN=api.preprod.<domaine> \
bash /root/sae501-deploy/bootstrap-server.sh
```

(Copier la clé publique `sae501_deploy.pub` dans `/root/sae501-deploy/` au préalable, ou passer
son contenu directement.)

Le script, idempotent, peut être relancé sans risque. Il :

1. installe Docker Engine et le plugin Compose depuis le dépôt officiel Docker, ainsi qu’UFW,
   Fail2ban, unattended-upgrades et cron ;
2. crée l’utilisateur `deploy` (sans mot de passe, membre du groupe `docker`) et ajoute la clé
   publique avec l’option `restrict` (ni redirection de ports, ni agent, ni terminal) ;
3. ouvre uniquement 22, 80 et 443 en TCP avec UFW ;
4. active Fail2ban pour SSH (5 échecs en 10 min : 1 h de bannissement) ;
5. active les mises à jour de sécurité automatiques ;
6. crée `/srv/sae501/{bin,edge,preprod,prod,backups}` ;
7. génère sur le serveur, sans jamais les afficher, `APP_SECRET`, les mots de passe MySQL et la
   passphrase JWT de chaque `.env`, puis une clé JWT RSA 4096 chiffrée par environnement
   (`secrets/jwt/private.pem`, lisible par le seul groupe 10001 de l’image backend) ;
8. crée les réseaux `sae501-preprod_edge` et `sae501-prod_edge` ;
9. installe la sauvegarde quotidienne (`/etc/cron.d/sae501-backup`, 03:17 UTC).

Ensuite, en tant que `deploy`, compléter les valeurs `CHANGE_ME` restantes (le script les liste,
sans afficher de valeur) :

```bash
sudo -iu deploy
```

```bash
nano /srv/sae501/preprod/.env
```

- `MAILER_DSN` : `brevo+api://<clé API Brevo de l’environnement>@default`, ou `null://null`
  tant que Brevo n’est pas configuré ;
- `MAILER_FROM` : adresse d’expéditeur validée dans Brevo ;
- les domaines si le script a été lancé sans eux (`FRONTEND_DOMAIN`, `API_DOMAIN`,
  `FRONTEND_URL`, `CORS_ALLOW_ORIGIN` sous la forme `'^https://www\.<domaine>$'`).

Ne jamais copier ces fichiers hors du serveur ni les coller dans un ticket ou un chat.
`deploy.sh` refuse de déployer tant qu’une valeur `CHANGE_ME` ou `replace-with` subsiste.

Optionnel, une fois la connexion par clé SSH vérifiée pour l’administrateur :

```bash
HARDEN_SSH=1 DEPLOY_PUBLIC_KEY="$(cat /root/sae501-deploy/sae501_deploy.pub)" bash /root/sae501-deploy/bootstrap-server.sh
```

désactive l’authentification SSH par mot de passe (configuration validée par `sshd -t` avant
rechargement).

### Empreinte SSH du serveur

La CD n’accepte que l’hôte dont la clé est déclarée (`StrictHostKeyChecking yes`). Récupérer la
clé publique de l’hôte **et vérifier son empreinte** avec celle affichée par la console du VPS (ou
par `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub` sur le serveur) :

```bash
ssh-keyscan -t ed25519 <vps> > known_hosts_sae501
```

```bash
ssh-keygen -lf known_hosts_sae501
```

Le contenu de `known_hosts_sae501` va dans le secret `DEPLOY_KNOWN_HOSTS`. Si SSH écoute sur un
autre port, utiliser `ssh-keyscan -p <port>` et définir la variable `DEPLOY_PORT`.

## 3. Configuration GitHub

### Environnements

Dans *Settings → Environments*, créer :

- `preprod` : branche de déploiement autorisée `develop` ;
- `production` : branches autorisées `main` et tags `v*` ; **Required reviewers** (au moins une
  personne) pour exiger une approbation avant chaque déploiement de production, et éventuellement
  *Prevent self-review*.

### Secrets (dans chaque environnement)

| Secret | Contenu |
|---|---|
| `DEPLOY_HOST` | nom DNS ou IP du VPS |
| `DEPLOY_USER` | `deploy` |
| `DEPLOY_SSH_KEY` | clé privée `sae501_deploy` complète |
| `DEPLOY_KNOWN_HOSTS` | ligne(s) obtenue(s) par `ssh-keyscan`, après vérification de l’empreinte |
| `DEPLOY_PATH` | `/srv/sae501` |

Les secrets peuvent être définis au niveau du dépôt s’ils sont identiques pour les deux
environnements ; les définir par environnement permet de changer de serveur pour un seul.
Aucun secret applicatif (mots de passe, JWT, Brevo) n’est stocké dans GitHub : ils ne vivent que
sur le serveur.

### Variables (dans chaque environnement)

| Variable | Exemple production | Rôle |
|---|---|---|
| `PUBLIC_API_URL` | `https://api.<domaine>` | figée dans le bundle frontend ; healthcheck final |
| `PUBLIC_FRONTEND_URL` | `https://www.<domaine>` | lien de l’environnement GitHub ; healthcheck final |
| `DEPLOY_PORT` | `22` | facultatif |

### Activation du déploiement automatique

Tant que la variable de **dépôt** `DEPLOY_ENABLED` (*Settings → Secrets and variables → Actions →
Variables*) ne vaut pas `true`, un push sur `develop` ou `main` construit, analyse et publie les
images mais saute le déploiement, sans échec. La définir à `true` une fois le serveur mis en
service et les secrets créés. « Run workflow » déploie dans tous les cas.

Elle doit être créée dans **Repository variables**, pas dans un environnement : GitHub évalue la
condition du job avant d’ouvrir l’environnement, une variable d’environnement n’y est donc pas
visible et le déploiement serait sauté.

### Images GHCR

Les paquets `sae501/backend` et `sae501/frontend` sont créés au premier push et restent privés
(dépôt privé). Le serveur les télécharge avec le jeton éphémère du job, transmis sur l’entrée
standard de SSH, utilisé dans un dossier Docker temporaire puis supprimé : aucun jeton GHCR n’est
conservé sur le serveur.

## 4. Déploiement

Le workflow `CD` (`.github/workflows/cd.yml`) :

1. détermine l’environnement (`develop` → preprod, `main` → production) ;
2. construit l’image backend (stage `prod`, sans dépendances de dev, utilisateur non root),
   l’analyse avec Trivy (échec sur CRITICAL corrigeable) et la publie ;
3. dans l’environnement GitHub (approbation éventuelle), construit l’image frontend avec
   `PUBLIC_API_URL`, l’analyse et la publie ;
4. envoie `docker-compose.prod.yml`, les scripts et le proxy d’entrée dans
   `/srv/sae501/.incoming/<env>/`, puis lance `deploy.sh` qui, sous un verrou global :
   - installe ces fichiers ;
   - vérifie le `.env` (projet, valeurs à compléter, domaines) et les clés JWT ;
   - télécharge les images ;
   - démarre MySQL et attend qu’il soit prêt ;
   - sauvegarde la base (`backups/<env>/db-pre-deploy-*.sql.gz`) ;
   - exécute `doctrine:migrations:migrate --all-or-nothing` ;
   - lance `docker compose up -d --wait` (healthchecks de MySQL, du backend et du frontend) ;
   - met à jour le routage du proxy d’entrée ;
5. vérifie depuis Internet `PUBLIC_API_URL/healthcheck.php` et `PUBLIC_FRONTEND_URL`.

Les actions GitHub sont figées par SHA de commit ; le workflow n’a aucune permission par défaut
et seuls les jobs de publication reçoivent `packages: write`.

Déploiement manuel d’une référence (tag `vX.Y.Z`, branche) : *Actions → CD → Run workflow*,
choisir la référence et l’environnement, laisser `image_tag` vide.

État d’un environnement sur le serveur :

```bash
/srv/sae501/bin/deploy.sh status prod
```

### Premier compte administrateur

Les fixtures ne sont jamais chargées sur le serveur : après le premier déploiement, la base ne
contient aucun compte. Créer l’administrateur de la mairie depuis le serveur, en tant que
`deploy` (remplacer `preprod` par `prod` pour la production) :

```bash
docker exec -it sae501-preprod-backend-1 php bin/console app:create-admin adresse@domaine.fr --prenom=Prénom --nom=Nom
```

Le mot de passe (12 caractères minimum, avec majuscule, minuscule et chiffre) est demandé deux fois,
masqué : il n’apparaît ni dans l’historique du shell, ni dans les logs. La commande refuse une
adresse déjà utilisée et le mode non interactif. Les autres comptes (agents, associations) se
créent ensuite depuis l’application.

### Mémoire : préproduction et production sur le même VPS

Les deux environnements tournent en parallèle sur le même serveur. Pour qu’ils tiennent ensemble,
`docker-compose.prod.yml` borne la mémoire de chaque service (valeurs par défaut, modifiables dans
le `.env` de l’environnement, voir `.env.prod.example`) :

| Service | Limite | Réglage |
|---|---|---|
| MySQL | 512 Mo | `performance_schema` désactivé, cache InnoDB 128 Mo, 40 connexions |
| Backend (FrankenPHP) | 512 Mo | 2 workers PHP (`FRANKENPHP_WORKERS`) |
| Frontend (Next.js) | 320 Mo | tas Node 192 Mo |
| Worker Messenger | 256 Mo | redémarre au-delà de 160 Mo |
| Planificateur de campagnes | 192 Mo | |

Soit environ 1,8 Go au maximum par environnement ; l’usage réel est nettement inférieur. Le job de
déploiement utilise un groupe de concurrence commun (`deploy-vps`) : préproduction et production ne
se déploient jamais en même temps. Ne pas fusionner plusieurs PR dans `main` à la suite : chacune
déclenche un déploiement de production.

Un fichier d’échange évite qu’un pic de mémoire (premier démarrage de MySQL, téléchargement
d’images) ne bloque le serveur. À créer une fois, en root, s’il n’existe pas (`swapon --show` vide) :

```bash
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
sysctl -w vm.swappiness=10 && echo 'vm.swappiness=10' > /etc/sysctl.d/99-swappiness.conf
```

Suivre la consommation : `docker stats --no-stream` et `free -h`.

## 5. Retour arrière

**Automatique** : si la nouvelle version ne devient pas saine, `deploy.sh` redémarre aussitôt les
images précédentes et le job échoue. Les migrations déjà appliquées ne sont **pas** annulées.

**Depuis GitHub** (recommandé) : *Run workflow*, environnement voulu, `image_tag` = SHA complet du
commit précédemment déployé (visible dans le résumé des exécutions CD ou dans
`/srv/sae501/<env>/.deploy/history`). Le compose et les scripts de ce commit sont réutilisés et
aucune image n’est reconstruite.

**Sur le serveur, sans GitHub** : revient à la version précédente, dont les images sont encore
présentes localement :

```bash
/srv/sae501/bin/deploy.sh rollback prod
```

**Base de données** : si la version annulée avait appliqué une migration incompatible avec
l’ancienne version, restaurer la sauvegarde prise juste avant le déploiement (voir ci-dessous),
après avoir revérifié qu’aucune donnée saisie depuis ne doit être conservée. Pour éviter ce cas,
écrire des migrations rétrocompatibles (ajouter avant de supprimer, en deux livraisons).

## 6. Sauvegardes et restauration

Chaque nuit, `backup.sh all` sauvegarde pour chaque environnement :

- la base MySQL : `backups/<env>/db-daily-<date>.sql.gz` (`mysqldump --single-transaction`) ;
- les volumes d’uploads publics et privés : `backups/<env>/uploads-daily-<date>.tar.gz`.

Les fichiers sont en `0600` dans `/srv/sae501/backups` (`0700`) et conservés 14 jours
(`BACKUP_RETENTION_DAYS`). Le journal est dans `/srv/sae501/backups/backup.log`.

Sauvegarde ponctuelle :

```bash
/srv/sae501/bin/backup.sh db prod avant-maintenance
```

```bash
/srv/sae501/bin/backup.sh uploads prod avant-maintenance
```

Restauration (destructive, confirmation `--yes` obligatoire) :

```bash
/srv/sae501/bin/backup.sh restore-db prod /srv/sae501/backups/prod/db-daily-20261115T031700Z.sql.gz --yes
```

```bash
/srv/sae501/bin/backup.sh restore-uploads prod /srv/sae501/backups/prod/uploads-daily-20261115T031700Z.tar.gz --yes
```

Le dump contient `DROP DATABASE` puis `CREATE DATABASE` : la base est entièrement remplacée.
Restaurer de préférence pendant une maintenance (`docker compose stop backend messenger-worker
campaign-scheduler` dans le dossier de l’environnement), puis relancer `deploy.sh` ou
`docker compose up -d`.

**À compléter** : les sauvegardes restent sur le VPS. Elles contiennent des données personnelles
(RGPD) ; une copie hors site chiffrée (par exemple `restic` vers un stockage objet, ou les
instantanés de l’hébergeur) doit être choisie avec la mairie. Tester une restauration sur la
préproduction au moins une fois par trimestre.

## 7. E-mails Brevo : SPF, DKIM et DMARC

1. Dans Brevo, *Senders, Domains & Dedicated IPs → Domains*, ajouter le domaine d’envoi
   (celui de `MAILER_FROM`).
2. Publier dans la zone DNS les enregistrements fournis par Brevo :
   - **code Brevo** (`TXT brevo-code:…`) qui prouve la propriété du domaine ;
   - **DKIM** : les enregistrements `CNAME` ou `TXT` indiqués (sélecteurs propres à Brevo) ;
   - **SPF** : ajouter `include:spf.brevo.com` à l’enregistrement SPF existant ; un domaine ne
     doit avoir qu’**un seul** enregistrement `TXT v=spf1`, par exemple
     `v=spf1 include:spf.brevo.com ~all` ;
   - **DMARC** : `TXT` sur `_dmarc.<domaine>`, en commençant par une politique d’observation
     `v=DMARC1; p=none; rua=mailto:dmarc@<domaine>`, puis `p=quarantine` une fois les rapports
     propres.
3. Attendre l’authentification du domaine dans Brevo, puis créer **une clé API par environnement**
   (*SMTP & API → API Keys*) et la placer dans `MAILER_DSN` du `.env` correspondant.
4. Une clé exposée doit être révoquée dans Brevo puis remplacée dans le `.env`, suivi d’un
   redéploiement (ou `docker compose up -d` dans le dossier de l’environnement).

Utiliser une adresse d’expéditeur distincte pour la préproduction (par exemple
`noreply-preprod@…`) évite toute confusion avec les messages réels.

## 8. Cloudflare (optionnel)

Cloudflare se place devant le VPS : WAF, limitation de débit, protection DDoS et masquage de l’IP.
Le proxy d’entrée est prêt ; le passage se fait sans modifier le code.

1. **Compte et zone** : ajouter `wahelgader.fr` dans Cloudflare (offre gratuite), vérifier que les
   enregistrements importés (A des quatre sous-domaines, MX et TXT de Brevo : SPF, DKIM, DMARC)
   sont complets, puis remplacer chez OVH les serveurs DNS par ceux indiqués par Cloudflare.
2. **DNS** : les quatre enregistrements A en mode *Proxied* (nuage orange) ; les enregistrements de
   messagerie restent en *DNS only*.
3. **SSL/TLS** : mode **Full (strict)** (Caddy garde ses certificats Let’s Encrypt valides),
   *Always Use HTTPS* et TLS 1.2 minimum. Les certificats déjà émis se renouvellent sans
   intervention : Let’s Encrypt passe par Cloudflare sur le port 80.
4. **Activer le mode Cloudflare du proxy d’entrée** : sur le VPS, dans `edge/.env`, passer
   `EDGE_CLOUDFLARE=1`, puis relancer un déploiement (ou `deploy.sh deploy` sur l’environnement
   courant). Le proxy :
   - lit l’IP du visiteur dans `CF-Connecting-IP`, uniquement si la connexion vient d’une plage
     Cloudflare : les limiteurs de connexion et d’inscription de l’API comptent par visiteur ;
   - refuse toute connexion directe à l’IP du VPS : le WAF ne peut pas être contourné.

   Les plages sont lues dans `docker/deploy/edge/cloudflare-ips.txt` (à comparer de temps en temps
   avec https://www.cloudflare.com/ips/). Pour revenir en arrière : `EDGE_CLOUDFLARE=0` et
   redéploiement, **avant** de repasser les DNS en *DNS only*.
5. **Sécurité** (Security → WAF) :
   - activer les *Managed Rules* gratuites et le *Bot Fight Mode* ;
   - règle de limitation de débit : `POST` sur `/api/auth/` (connexion, inscription,
     réinitialisation), par exemple 20 requêtes par minute et par IP, action *Block* 10 minutes ;
   - en préproduction, *Cloudflare Access* (Zero Trust, gratuit jusqu’à 50 utilisateurs) peut
     réserver `dev-feytiat` et `api-dev-feytiat` à l’équipe.
6. **Cache** : laisser le comportement par défaut. L’API et les documents privés répondent en
   `Cache-Control: private, no-store` et ne sont jamais mis en cache par Cloudflare.

Contrôle après bascule : `curl -sI https://feytiat.wahelgader.fr` affiche `server: cloudflare` et
un en-tête `cf-ray` ; une requête directe sur l’IP du VPS
(`curl -sk --resolve feytiat.wahelgader.fr:443:<IP> https://feytiat.wahelgader.fr`) est coupée.

## 7 bis. Copie chiffrée des sauvegardes hors du serveur

Les sauvegardes quotidiennes restent sur le VPS : si le serveur est perdu, elles le sont aussi.
`backup.sh` peut en envoyer chaque nuit une copie chiffrée avec restic (AES-256, chiffrée avant
l’envoi : le stockage ne voit jamais les données en clair).

1. Choisir un stockage compatible S3 (OVH Object Storage, Scaleway, Backblaze B2…) et créer un
   bucket privé avec une clé d’accès limitée à ce bucket.
2. Sur le VPS, en tant que `deploy`, créer `backups/offsite.env` (droits 0600) :

   ```bash
   install -m 0600 /dev/null ~/sae501/backups/offsite.env
   nano ~/sae501/backups/offsite.env
   ```

   ```dotenv
   RESTIC_REPOSITORY=s3:https://s3.gra.io.cloud.ovh.net/<bucket>/sae501
   RESTIC_PASSWORD=<longue phrase aléatoire, à conserver aussi dans un gestionnaire de mots de passe>
   AWS_ACCESS_KEY_ID=<clé>
   AWS_SECRET_ACCESS_KEY=<secret>
   ```

3. Premier envoi et vérification : `bin/backup.sh offsite` puis `bin/backup.sh offsite-snapshots`.
   Ensuite, la tâche de 03:17 l’envoie automatiquement (14 copies quotidiennes, 8 hebdomadaires,
   12 mensuelles conservées).

Sans `RESTIC_PASSWORD`, les copies sont illisibles, y compris pour vous : le garder hors du VPS.
`offsite.env` n’est jamais inclus dans les copies. Restauration : `docker run --rm --env-file
backups/offsite.env -v /tmp/restauration:/restore restic/restic:0.18.1 restore latest --target /restore`,
puis `backup.sh restore-db` / `restore-uploads` sur les fichiers obtenus.

## 8 bis. Antivirus des fichiers déposés (facultatif)

Les pièces justificatives, fichiers d’événement et images peuvent être analysés par ClamAV avant
d’être enregistrés. Le service demande environ 1 Go de mémoire : à n’activer que si le VPS le
permet (`free -h`).

1. Dans le `.env` de l’environnement : `COMPOSE_PROFILES=antivirus` et
   `CLAMAV_DSN=tcp://clamav:3310`.
2. Redéployer. Au premier démarrage, ClamAV télécharge ses signatures (quelques minutes) : pendant
   ce temps, un dépôt est refusé avec « réessayez plus tard », jamais enregistré sans analyse.
3. Un fichier infecté est refusé (422) et signalé dans les journaux (`antivirus: fichier refusé`).

Pour désactiver : retirer les deux lignes et redéployer.

## 9. Points d’attention

- Le groupe `docker` donne un accès équivalent à root : la clé `deploy` ne sert qu’à la CD et ne
  doit pas être réutilisée ailleurs.
- Les ports publiés par Docker contournent UFW : ne jamais ajouter de `ports:` à
  `docker-compose.prod.yml` (MySQL, phpMyAdmin, Mailpit, etc.). L’administration de la base se
  fait par `docker compose exec mysql mysql …` ou un tunnel SSH.
- Les volumes créés par une ancienne image (backend root) appartiennent à root : sur un serveur
  déjà en service, donner les uploads à l’utilisateur 10001 avant le premier déploiement non root
  (`docker run --rm -v sae501-prod_backend_uploads:/v alpine:3.22 chown -R 10001:10001 /v`, de
  même pour `backend_private_uploads`). Un serveur neuf n’est pas concerné.
- Les migrations doivent être rétrocompatibles avec la version précédente pour que le retour
  arrière automatique reste sûr.
