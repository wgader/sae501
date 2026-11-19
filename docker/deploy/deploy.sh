#!/usr/bin/env bash
# Déploie la préproduction ou la production de SAE501 sur le serveur.
# Appelé par la CD (.github/workflows/cd.yml) par SSH, ou à la main par l’utilisateur de déploiement.
#
# Usage :
#   deploy.sh deploy   <preprod|prod> <image_tag> [options]
#   deploy.sh rollback <preprod|prod> [options]
#   deploy.sh status   <preprod|prod> [options]
#
# Options :
#   --base-dir DIR      racine des environnements (par défaut : dossier parent de ce script)
#   --from DIR          installe d’abord les fichiers envoyés par la CD depuis DIR
#   --registry-login    lit deux lignes sur l’entrée standard (utilisateur, jeton) pour ghcr.io ;
#                       le jeton n’est écrit que dans un dossier temporaire supprimé après le pull
#
# Étapes d’un déploiement : pull de l’image, sauvegarde de la base, migrations Doctrine,
# démarrage avec attente des healthchecks, puis routage par le proxy d’entrée. Si les conteneurs
# ne deviennent pas sains, l’image précédente est redémarrée automatiquement (la base n’est
# jamais restaurée automatiquement : voir DEPLOYMENT.md, « Retour arrière »).
set -Eeuo pipefail
umask 027

readonly REGISTRY=ghcr.io
readonly WAIT_TIMEOUT=300
readonly PROJECT_PREFIX=sae501

log() { printf '[%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*" >&2; }
die() { log "ERREUR : $*"; exit 1; }

usage() {
  sed -n '2,15p' "$0" | sed 's/^# \{0,1\}//' >&2
  exit 2
}

# Lit une valeur du fichier .env sans l’interpréter par le shell (pas de source) et retire
# d’éventuels guillemets.
env_value() {
  local key=$1 file=$2 value
  value=$(sed -n "s/^${key}=//p" "$file" | tail -n 1)
  value=${value%\"}; value=${value#\"}
  value=${value%\'}; value=${value#\'}
  printf '%s' "$value"
}

compose() {
  docker compose --project-directory "$ENV_DIR" --env-file "$ENV_DIR/.env" \
    -f "$ENV_DIR/docker-compose.prod.yml" "$@"
}

edge_compose() {
  local args=(--project-directory "$BASE_DIR/edge" -f "$BASE_DIR/edge/compose.yml")
  [[ -f "$BASE_DIR/edge/.env" ]] && args+=(--env-file "$BASE_DIR/edge/.env")
  docker compose "${args[@]}" "$@"
}

# ── Arguments ─────────────────────────────────────────────────────────────────
[[ $# -ge 2 ]] || usage
ACTION=$1; ENVIRONMENT=$2; shift 2
IMAGE_TAG=""
if [[ "$ACTION" == deploy ]]; then
  [[ $# -ge 1 ]] || usage
  IMAGE_TAG=$1; shift
fi

BASE_DIR=$(cd "$(dirname "$0")/.." && pwd)
FROM_DIR=""
REGISTRY_LOGIN=0
while [[ $# -gt 0 ]]; do
  case $1 in
    --base-dir) BASE_DIR=${2:?}; shift 2 ;;
    --from) FROM_DIR=${2:?}; shift 2 ;;
    --registry-login) REGISTRY_LOGIN=1; shift ;;
    *) usage ;;
  esac
done

case $ACTION in deploy|rollback|status) ;; *) usage ;; esac
case $ENVIRONMENT in preprod|prod) ;; *) die "environnement inconnu : $ENVIRONMENT (preprod ou prod)" ;; esac
readonly TAG_PATTERN='^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$'
if [[ "$ACTION" == deploy ]]; then
  [[ "$IMAGE_TAG" =~ $TAG_PATTERN ]] || die "étiquette d’image invalide"
fi

readonly PROJECT="$PROJECT_PREFIX-$ENVIRONMENT"
readonly ENV_DIR="$BASE_DIR/$ENVIRONMENT"
readonly STATE_DIR="$ENV_DIR/.deploy"
[[ -d "$ENV_DIR" ]] || die "$ENV_DIR absent : lancer d’abord bootstrap-server.sh"

# Un seul déploiement à la fois sur le serveur : la préproduction et la production partagent le
# proxy d’entrée et les scripts de bin/.
exec 9>"$BASE_DIR/.deploy.lock"
flock -w 900 9 || die "un autre déploiement est en cours"

# ── Installation des fichiers envoyés par la CD ────────────────────────────────
# install(1) remplace chaque fichier par un nouveau : un script en cours d’exécution dans l’autre
# environnement n’est jamais modifié sous ses pieds.
if [[ -n "$FROM_DIR" ]]; then
  [[ -d "$FROM_DIR" ]] || die "$FROM_DIR absent"
  install -d -m 0750 "$BASE_DIR/bin" "$BASE_DIR/edge"
  # Caddy tourne en root sans CAP_DAC_OVERRIDE (cap_drop: ALL) : il ne lit que des fichiers
  # lisibles par tous. Le Caddyfile et les sites ne contiennent aucun secret.
  install -d -m 0755 "$BASE_DIR/edge/sites"
  install -m 0640 "$FROM_DIR/docker-compose.prod.yml" "$ENV_DIR/docker-compose.prod.yml"
  install -m 0750 "$FROM_DIR/docker/deploy/deploy.sh" "$FROM_DIR/docker/deploy/backup.sh" "$BASE_DIR/bin/"
  install -m 0640 "$FROM_DIR/docker/deploy/edge/compose.yml" "$BASE_DIR/edge/"
  install -m 0644 "$FROM_DIR/docker/deploy/edge/Caddyfile" "$FROM_DIR/docker/deploy/edge/cloudflare-ips.txt" "$BASE_DIR/edge/"
  log "fichiers de déploiement installés depuis $FROM_DIR"
fi

# ── Contrôles du fichier .env ─────────────────────────────────────────────────
ENV_FILE="$ENV_DIR/.env"
[[ -f "$ENV_FILE" ]] || die "$ENV_FILE absent : lancer bootstrap-server.sh"
[[ -f "$ENV_DIR/docker-compose.prod.yml" ]] || die "docker-compose.prod.yml absent dans $ENV_DIR"

# Garde-fou contre un .env copié d’un autre environnement : les volumes en dépendent.
[[ "$(env_value COMPOSE_PROJECT_NAME "$ENV_FILE")" == "$PROJECT" ]] \
  || die "COMPOSE_PROJECT_NAME doit valoir $PROJECT dans $ENV_FILE"

# Seuls les noms des variables sont affichés, jamais leurs valeurs.
placeholders=$(grep -E '^[A-Z_]+=.*(CHANGE_ME|replace-with)' "$ENV_FILE" | cut -d= -f1 | tr '\n' ' ' || true)
[[ -z "$placeholders" ]] || die "valeurs à renseigner dans $ENV_FILE : $placeholders"

for key_file in private.pem public.pem; do
  [[ -e "$ENV_DIR/secrets/jwt/$key_file" ]] || die "clé JWT secrets/jwt/$key_file absente"
done

# Les domaines sont recopiés dans la configuration Caddy : seuls des noms DNS sont acceptés.
readonly DOMAIN_PATTERN='^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$'
FRONTEND_DOMAIN=$(env_value FRONTEND_DOMAIN "$ENV_FILE")
[[ "$FRONTEND_DOMAIN" =~ $DOMAIN_PATTERN ]] || die "FRONTEND_DOMAIN invalide dans $ENV_FILE"

# ── Fonctions de déploiement ──────────────────────────────────────────────────
read_state() {
  local file="$STATE_DIR/$1"
  [[ -f "$file" ]] || return 1
  # Un état écrit avant l’image unique (BACKEND_IMAGE_TAG) ne peut pas être redémarré.
  APP_IMAGE_TAG=$(env_value APP_IMAGE_TAG "$file")
  [[ -n "$APP_IMAGE_TAG" ]]
}

write_state() {
  install -d -m 0750 "$STATE_DIR"
  printf 'APP_IMAGE_TAG=%s\n' "$2" > "$STATE_DIR/$1.tmp"
  mv "$STATE_DIR/$1.tmp" "$STATE_DIR/$1"
}

ensure_edge_networks() {
  local network
  for network in "$PROJECT_PREFIX-preprod_edge" "$PROJECT_PREFIX-prod_edge"; do
    docker network inspect "$network" >/dev/null 2>&1 || docker network create "$network" >/dev/null
  done
}

start_stack() {
  export APP_IMAGE_TAG
  compose up --detach --remove-orphans --wait --wait-timeout "$WAIT_TIMEOUT"
}

pull_images() {
  local registry_user registry_token docker_config=""
  if [[ "$REGISTRY_LOGIN" == 1 ]]; then
    IFS= read -r registry_user || die "utilisateur du registre absent sur l’entrée standard"
    IFS= read -r registry_token || die "jeton du registre absent sur l’entrée standard"
    docker_config=$(mktemp -d)
    # shellcheck disable=SC2064 # le chemin est figé maintenant, volontairement.
    trap "rm -rf '$docker_config'" EXIT
    printf '%s' "$registry_token" \
      | DOCKER_CONFIG=$docker_config docker login "$REGISTRY" --username "$registry_user" --password-stdin >/dev/null
    unset registry_token
  fi
  export APP_IMAGE_TAG
  if [[ -n "$docker_config" ]]; then
    DOCKER_CONFIG=$docker_config compose pull --quiet
    DOCKER_CONFIG=$docker_config docker logout "$REGISTRY" >/dev/null 2>&1 || true
    rm -rf "$docker_config"
  else
    compose pull --quiet
  fi
}

# Derrière Cloudflare (EDGE_CLOUDFLARE=1 dans edge/.env) : l’IP du visiteur est lue dans
# CF-Connecting-IP, uniquement depuis les plages Cloudflare, et toute connexion directe au VPS est
# refusée pour que le WAF ne puisse pas être contourné. Sinon, les deux fichiers sont neutres.
write_edge_proxy() {
  local proxy_dir="$BASE_DIR/edge/proxy" ranges=""
  install -d -m 0755 "$proxy_dir"
  if [[ "$(env_value EDGE_CLOUDFLARE "$BASE_DIR/edge/.env" 2>/dev/null)" == "1" ]]; then
    # Seules des plages CIDR sont recopiées dans la configuration.
    ranges=$(grep -E '^[0-9a-fA-F:.]+/[0-9]{1,3}$' "$BASE_DIR/edge/cloudflare-ips.txt" | tr '\n' ' ')
    [[ -n "$ranges" ]] || die "EDGE_CLOUDFLARE=1 mais aucune plage dans edge/cloudflare-ips.txt"
    printf 'servers {\n\ttrusted_proxies static %s\n\tclient_ip_headers CF-Connecting-IP\n}\n' "$ranges" > "$proxy_dir/global.caddy.tmp"
    printf '(origin_guard) {\n\t@direct not remote_ip %s\n\tabort @direct\n}\n' "$ranges" > "$proxy_dir/guard.caddy.tmp"
    log "proxy d’entrée : mode Cloudflare (connexions directes refusées)"
  else
    printf '# Accès direct : aucun proxy de confiance en amont.\n' > "$proxy_dir/global.caddy.tmp"
    printf '(origin_guard) {\n}\n' > "$proxy_dir/guard.caddy.tmp"
  fi
  chmod 0644 "$proxy_dir/global.caddy.tmp" "$proxy_dir/guard.caddy.tmp"
  mv "$proxy_dir/global.caddy.tmp" "$proxy_dir/global.caddy"
  mv "$proxy_dir/guard.caddy.tmp" "$proxy_dir/guard.caddy"
}

# Le proxy d’entrée envoie tout le domaine de l’environnement au service app (front et /api).
update_edge() {
  write_edge_proxy
  local site_file="$BASE_DIR/edge/sites/$PROJECT.caddy"
  install -d -m 0755 "$BASE_DIR/edge/sites"
  cat > "$site_file.tmp" <<EOF
# Généré par deploy.sh pour $PROJECT à partir de $ENV_FILE : ne pas modifier à la main.
$FRONTEND_DOMAIN {
	import common
	# Symfony (limiteurs de connexion) lit l’IP du visiteur dans X-Forwarded-For.
	reverse_proxy $PROJECT-app:80 {
		header_up X-Forwarded-For {client_ip}
	}
}
EOF
  chmod 0644 "$site_file.tmp"
  mv "$site_file.tmp" "$site_file"
  edge_compose up --detach --wait --wait-timeout 60
  # Le Caddyfile est monté comme fichier unique : install(1) le remplace par un nouvel inode que le
  # conteneur ne voit pas. S'il diffère de celui chargé, on recrée le proxy pour monter le nouveau.
  if ! edge_compose exec -T caddy cat /etc/caddy/Caddyfile | cmp -s - "$BASE_DIR/edge/Caddyfile"; then
    log "Caddyfile modifié : recréation du proxy d’entrée"
    edge_compose up --detach --wait --wait-timeout 60 --force-recreate
  fi
  # Le rechargement valide d’abord la configuration ; en cas d’erreur, l’ancienne reste active.
  edge_compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
}

# ── Actions ───────────────────────────────────────────────────────────────────
case $ACTION in
  status)
    if read_state current; then
      log "$PROJECT : image $APP_IMAGE_TAG"
      export APP_IMAGE_TAG
      compose ps
    else
      log "$PROJECT : aucun déploiement enregistré"
    fi
    ;;

  rollback)
    read_state previous || die "aucune version précédente enregistrée pour $PROJECT"
    previous=$APP_IMAGE_TAG
    log "retour à l’image $previous (migrations non annulées)"
    start_stack || die "la version précédente ne démarre pas non plus : voir compose logs"
    if read_state current; then
      write_state previous "$APP_IMAGE_TAG"
    fi
    write_state current "$previous"
    printf '%s rollback image=%s\n' "$(date -u +%FT%TZ)" "$previous" >> "$STATE_DIR/history"
    log "retour arrière terminé"
    ;;

  deploy)
    ensure_edge_networks
    APP_IMAGE_TAG=$IMAGE_TAG
    log "pull de l’image $IMAGE_TAG"
    pull_images

    log "démarrage de MySQL"
    compose up --detach --wait --wait-timeout "$WAIT_TIMEOUT" mysql

    log "sauvegarde de la base avant migration"
    "$BASE_DIR/bin/backup.sh" db "$ENVIRONMENT" pre-deploy --base-dir "$BASE_DIR"

    log "migrations Doctrine"
    compose run --rm --no-deps -T app \
      php bin/console doctrine:migrations:migrate --no-interaction --all-or-nothing

    log "démarrage de la nouvelle version"
    if ! start_stack; then
      log "la nouvelle version n’est pas saine"
      compose ps >&2 || true
      if read_state current; then
        log "redémarrage de la version précédente (image $APP_IMAGE_TAG)"
        start_stack || log "la version précédente ne démarre pas non plus"
      fi
      die "déploiement échoué ; base non restaurée (dernière sauvegarde dans $BASE_DIR/backups/$ENVIRONMENT)"
    fi

    if read_state current; then
      write_state previous "$APP_IMAGE_TAG"
    fi
    write_state current "$IMAGE_TAG"
    printf '%s deploy image=%s\n' "$(date -u +%FT%TZ)" "$IMAGE_TAG" >> "$STATE_DIR/history"

    log "mise à jour du proxy d’entrée"
    update_edge

    # Seules les images sans étiquette sont supprimées : les versions précédentes restent
    # disponibles localement pour un retour arrière sans accès au registre.
    docker image prune --force >/dev/null
    log "déploiement de $PROJECT terminé"
    ;;
esac
