#!/usr/bin/env bash
# Mise en service d’un VPS Debian ou Ubuntu pour SAE501 (préproduction et production).
# À lancer en root, une première fois puis à chaque évolution du script : il est idempotent et
# ne remplace jamais un .env, une clé JWT ou un mot de passe déjà présents.
#
#   sudo DEPLOY_PUBLIC_KEY="ssh-ed25519 AAAA… github-actions-sae501" \
#        ACME_EMAIL=admin@example.fr \
#        PROD_FRONTEND_DOMAIN=www.example.fr PROD_API_DOMAIN=api.example.fr \
#        PREPROD_FRONTEND_DOMAIN=preprod.example.fr PREPROD_API_DOMAIN=api.preprod.example.fr \
#        bash bootstrap-server.sh
#
# Variables (toutes facultatives sauf DEPLOY_PUBLIC_KEY au premier lancement) :
#   DEPLOY_USER (deploy), BASE_DIR (/srv/sae501), DEPLOY_PUBLIC_KEY, ACME_EMAIL,
#   PROD_FRONTEND_DOMAIN, PROD_API_DOMAIN, PREPROD_FRONTEND_DOMAIN, PREPROD_API_DOMAIN,
#   BACKUP_RETENTION_DAYS (14), HARDEN_SSH (0 ; 1 désactive mots de passe et connexion root par
#   mot de passe : ne l’activer qu’après avoir vérifié une connexion par clé).
#
# Le script ne lit ni n’affiche jamais les secrets qu’il génère.
set -Eeuo pipefail
umask 022

readonly DEPLOY_USER=${DEPLOY_USER:-deploy}
readonly BASE_DIR=${BASE_DIR:-/srv/sae501}
readonly BACKUP_RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-14}
readonly HARDEN_SSH=${HARDEN_SSH:-0}
# Doit correspondre à APP_UID/APP_GID de docker/backend/Dockerfile : ce groupe lit les clés JWT.
readonly APP_GID=10001
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
readonly SCRIPT_DIR

log() { printf '\n==> %s\n' "$*"; }
die() { printf 'ERREUR : %s\n' "$*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "à lancer en root (sudo)"
[[ -r /etc/os-release ]] || die "/etc/os-release introuvable"
# shellcheck source=/dev/null
. /etc/os-release
case ${ID:-} in debian|ubuntu) ;; *) die "distribution non prise en charge : ${ID:-inconnue} (Debian ou Ubuntu)" ;; esac
[[ "$BACKUP_RETENTION_DAYS" =~ ^[0-9]+$ ]] || die "BACKUP_RETENTION_DAYS doit être un nombre"
[[ "$DEPLOY_USER" =~ ^[a-z_][a-z0-9_-]{0,31}$ ]] || die "DEPLOY_USER invalide"
[[ "$BASE_DIR" =~ ^/[A-Za-z0-9._/-]+$ ]] || die "BASE_DIR doit être un chemin absolu simple"

readonly DOMAIN_PATTERN='^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$'
for name in PROD_FRONTEND_DOMAIN PROD_API_DOMAIN PREPROD_FRONTEND_DOMAIN PREPROD_API_DOMAIN; do
  value=${!name:-}
  [[ -z "$value" || "$value" =~ $DOMAIN_PATTERN ]] || die "$name n’est pas un nom de domaine valide"
done

export DEBIAN_FRONTEND=noninteractive

# ── Paquets système ───────────────────────────────────────────────────────────
log "Paquets système"
apt-get update -q
apt-get install -y -q --no-install-recommends \
  ca-certificates curl gnupg openssl cron ufw fail2ban python3-systemd \
  unattended-upgrades apt-listchanges util-linux

# ── Docker Engine (dépôt officiel Docker) ─────────────────────────────────────
if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
  log "Installation de Docker Engine et du plugin Compose"
  install -d -m 0755 /etc/apt/keyrings
  curl -fsSL "https://download.docker.com/linux/$ID/gpg" -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  printf 'deb [arch=%s signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/%s %s stable\n' \
    "$(dpkg --print-architecture)" "$ID" "$VERSION_CODENAME" > /etc/apt/sources.list.d/docker.list
  apt-get update -q
  apt-get install -y -q docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
systemctl enable --now docker

# ── Utilisateur de déploiement ────────────────────────────────────────────────
log "Utilisateur de déploiement $DEPLOY_USER"
if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
  useradd --create-home --shell /bin/bash "$DEPLOY_USER"
fi
# Aucun mot de passe : connexion par clé SSH uniquement.
passwd --lock "$DEPLOY_USER" >/dev/null
# Le groupe docker équivaut à un accès root à la machine : ce compte ne sert qu’à la CD.
usermod --append --groups docker "$DEPLOY_USER"

DEPLOY_HOME=$(getent passwd "$DEPLOY_USER" | cut -d: -f6)
install -d -m 0700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$DEPLOY_HOME/.ssh"
AUTHORIZED_KEYS="$DEPLOY_HOME/.ssh/authorized_keys"
if [[ -n "${DEPLOY_PUBLIC_KEY:-}" ]]; then
  [[ "$DEPLOY_PUBLIC_KEY" =~ ^ssh-(ed25519|rsa)\ [A-Za-z0-9+/=]+(\ [^[:cntrl:]]*)?$ ]] \
    || die "DEPLOY_PUBLIC_KEY n’est pas une clé publique OpenSSH sur une ligne"
  key_body=$(cut -d' ' -f2 <<< "$DEPLOY_PUBLIC_KEY")
  # « restrict » interdit redirections de ports, agent et terminal ; scp et les commandes restent possibles.
  if ! grep -qsF "$key_body" "$AUTHORIZED_KEYS"; then
    printf 'restrict %s\n' "$DEPLOY_PUBLIC_KEY" >> "$AUTHORIZED_KEYS"
  fi
fi
[[ -s "$AUTHORIZED_KEYS" ]] || die "aucune clé autorisée pour $DEPLOY_USER : définir DEPLOY_PUBLIC_KEY"
chown "$DEPLOY_USER:$DEPLOY_USER" "$AUTHORIZED_KEYS"
chmod 0600 "$AUTHORIZED_KEYS"

# ── Durcissement SSH (optionnel) ──────────────────────────────────────────────
if [[ "$HARDEN_SSH" == 1 ]]; then
  log "Durcissement de sshd"
  install -d -m 0755 /etc/ssh/sshd_config.d
  cat > /etc/ssh/sshd_config.d/60-sae501.conf <<'EOF'
# Géré par bootstrap-server.sh (SAE501).
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
MaxAuthTries 3
EOF
  sshd -t || die "configuration sshd invalide : fichier /etc/ssh/sshd_config.d/60-sae501.conf à corriger"
  systemctl reload ssh 2>/dev/null || systemctl reload sshd
fi

# ── Pare-feu : SSH, HTTP et HTTPS uniquement ──────────────────────────────────
# Seul le proxy d’entrée publie des ports Docker (80/443) ; MySQL, phpMyAdmin et Mailpit ne
# sont jamais publiés. Les ports publiés par Docker contournent UFW : ne jamais en ajouter d’autres.
log "Pare-feu UFW"
ufw default deny incoming >/dev/null
ufw default allow outgoing >/dev/null
ufw allow 22/tcp >/dev/null
ufw allow 80/tcp >/dev/null
ufw allow 443/tcp >/dev/null
ufw --force enable >/dev/null

# ── Fail2ban pour SSH ─────────────────────────────────────────────────────────
log "Fail2ban (sshd)"
cat > /etc/fail2ban/jail.d/sae501-sshd.local <<'EOF'
# Géré par bootstrap-server.sh (SAE501).
[sshd]
enabled  = true
port     = ssh
backend  = systemd
maxretry = 5
findtime = 10m
bantime  = 1h
EOF
systemctl enable fail2ban >/dev/null
systemctl restart fail2ban

# ── Mises à jour de sécurité automatiques ─────────────────────────────────────
log "Mises à jour automatiques de sécurité"
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
// Géré par bootstrap-server.sh (SAE501).
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF
systemctl enable --now unattended-upgrades >/dev/null

# ── Arborescence ──────────────────────────────────────────────────────────────
log "Arborescence $BASE_DIR"
install -d -m 0750 -o "$DEPLOY_USER" -g "$DEPLOY_USER" \
  "$BASE_DIR" "$BASE_DIR/bin" "$BASE_DIR/edge" "$BASE_DIR/edge/sites" "$BASE_DIR/.incoming"
install -d -m 0700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" \
  "$BASE_DIR/backups" "$BASE_DIR/backups/preprod" "$BASE_DIR/backups/prod"
# Le dossier edge/sites est lu par le conteneur Caddy, qui tourne en root.
chmod 0755 "$BASE_DIR/edge/sites"

# Scripts livrés à côté de ce fichier : la CD les remplace ensuite à chaque déploiement.
for script in deploy.sh backup.sh; do
  if [[ -f "$SCRIPT_DIR/$script" && ! -f "$BASE_DIR/bin/$script" ]]; then
    install -m 0750 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$SCRIPT_DIR/$script" "$BASE_DIR/bin/$script"
  fi
done

# ── Secrets et .env de chaque environnement ───────────────────────────────────
random_hex() { openssl rand -hex 32; }

env_value() { sed -n "s/^$1=//p" "$2" | tail -n 1; }

# Échappe les points d’un domaine pour l’expression régulière CORS.
cors_regex() { printf "'^https://%s\$'" "${1//./\\.}"; }

write_env_file() {
  local environment=$1 frontend_domain=$2 api_domain=$3 database=$4 target=$5
  local cors frontend_url
  if [[ -n "$frontend_domain" ]]; then
    cors=$(cors_regex "$frontend_domain"); frontend_url="https://$frontend_domain"
  else
    frontend_domain=CHANGE_ME.example.com; cors="'CHANGE_ME'"; frontend_url=https://CHANGE_ME.example.com
  fi
  [[ -n "$api_domain" ]] || api_domain=CHANGE_ME.example.com
  # Les secrets sont générés directement dans le fichier, sans passer par l’affichage.
  cat > "$target" <<EOF
# Généré par bootstrap-server.sh le $(date -u +%F). Ne jamais commiter ni copier ce fichier.
# Modèle commenté : .env.$environment.example dans le dépôt.
COMPOSE_PROJECT_NAME=sae501-$environment

FRONTEND_DOMAIN=$frontend_domain
API_DOMAIN=$api_domain
FRONTEND_URL=$frontend_url
CORS_ALLOW_ORIGIN=$cors

BACKEND_IMAGE=ghcr.io/wgader/sae501/backend
FRONTEND_IMAGE=ghcr.io/wgader/sae501/frontend

APP_SECRET=$(random_hex)

MYSQL_DATABASE=$database
MYSQL_USER=$database
MYSQL_ROOT_PASSWORD=$(random_hex)
MYSQL_PASSWORD=$(random_hex)

JWT_PASSPHRASE=$(random_hex)

# Clé API Brevo propre à cet environnement (Brevo > SMTP & API), ou null://null pour ne rien envoyer.
MAILER_DSN=brevo+api://CHANGE_ME@default
MAILER_FROM=CHANGE_ME@example.com

MESSENGER_TRANSPORT_DSN=doctrine://default?auto_setup=0
SYMFONY_TRUSTED_PROXIES=private_ranges
EOF
}

# Clé privée chiffrée avec JWT_PASSPHRASE, transmise par un descripteur de fichier : elle
# n’apparaît ni dans la liste des processus, ni dans l’environnement.
generate_jwt_keys() {
  local env_file=$1 key_dir=$2 passphrase
  passphrase=$(env_value JWT_PASSPHRASE "$env_file")
  [[ -n "$passphrase" ]] || die "JWT_PASSPHRASE absente de $env_file"
  openssl genpkey -quiet -algorithm RSA -pkeyopt rsa_keygen_bits:4096 -aes-256-cbc \
    -pass fd:3 -out "$key_dir/private.pem" 3<<< "$passphrase"
  openssl pkey -in "$key_dir/private.pem" -passin fd:3 -pubout -out "$key_dir/public.pem" 3<<< "$passphrase"
  unset passphrase
}

setup_environment() {
  local environment=$1 frontend_domain=$2 api_domain=$3 database=$4
  local env_dir="$BASE_DIR/$environment" env_file key_dir
  env_file="$env_dir/.env"; key_dir="$env_dir/secrets/jwt"
  log "Environnement $environment"
  install -d -m 0750 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$env_dir" "$env_dir/secrets"
  # Le démon Docker (root) lit les clés ; le conteneur les lit grâce au groupe APP_GID.
  install -d -m 0750 -o root -g "$DEPLOY_USER" "$key_dir"

  if [[ ! -f "$env_file" ]]; then
    ( umask 077; write_env_file "$environment" "$frontend_domain" "$api_domain" "$database" "$env_file" )
    echo "  .env créé avec des secrets aléatoires"
  else
    echo "  .env existant conservé"
  fi
  chown "$DEPLOY_USER:$DEPLOY_USER" "$env_file"
  chmod 0600 "$env_file"

  if [[ ! -f "$key_dir/private.pem" ]]; then
    ( umask 077; generate_jwt_keys "$env_file" "$key_dir" )
    echo "  clés JWT générées"
  else
    echo "  clés JWT existantes conservées"
  fi
  chown root:"$APP_GID" "$key_dir/private.pem" "$key_dir/public.pem"
  chmod 0640 "$key_dir/private.pem"
  chmod 0644 "$key_dir/public.pem"

  local missing
  missing=$(grep -E '^[A-Z_]+=.*CHANGE_ME' "$env_file" | cut -d= -f1 | tr '\n' ' ' || true)
  [[ -z "$missing" ]] || echo "  à renseigner dans $env_file : $missing"
}

setup_environment preprod "${PREPROD_FRONTEND_DOMAIN:-}" "${PREPROD_API_DOMAIN:-}" sae501_preprod
setup_environment prod "${PROD_FRONTEND_DOMAIN:-}" "${PROD_API_DOMAIN:-}" sae501

# ── Proxy d’entrée ────────────────────────────────────────────────────────────
log "Proxy d’entrée"
if [[ ! -f "$BASE_DIR/edge/.env" ]]; then
  printf 'ACME_EMAIL=%s\n' "${ACME_EMAIL:-}" > "$BASE_DIR/edge/.env"
fi
chown "$DEPLOY_USER:$DEPLOY_USER" "$BASE_DIR/edge/.env"
chmod 0600 "$BASE_DIR/edge/.env"
for network in sae501-preprod_edge sae501-prod_edge; do
  docker network inspect "$network" >/dev/null 2>&1 || docker network create "$network" >/dev/null
done

# ── Sauvegardes quotidiennes ──────────────────────────────────────────────────
log "Sauvegarde quotidienne (03:17 UTC, rotation $BACKUP_RETENTION_DAYS jours)"
cat > /etc/cron.d/sae501-backup <<EOF
# Géré par bootstrap-server.sh (SAE501) : base MySQL et volumes d’uploads des deux environnements.
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
17 3 * * * $DEPLOY_USER BACKUP_RETENTION_DAYS=$BACKUP_RETENTION_DAYS $BASE_DIR/bin/backup.sh all >> $BASE_DIR/backups/backup.log 2>&1
EOF
chmod 0644 /etc/cron.d/sae501-backup
systemctl enable --now cron >/dev/null

log "Terminé"
cat <<EOF
Étapes suivantes (voir DEPLOYMENT.md) :
  1. compléter les valeurs CHANGE_ME de $BASE_DIR/preprod/.env et $BASE_DIR/prod/.env
     (en tant que $DEPLOY_USER, sans les copier ailleurs) ;
  2. renseigner ACME_EMAIL dans $BASE_DIR/edge/.env si besoin ;
  3. enregistrer l’empreinte SSH de ce serveur dans le secret GitHub DEPLOY_KNOWN_HOSTS ;
  4. lancer le workflow CD (push sur develop pour la préproduction).
EOF
