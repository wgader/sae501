#!/usr/bin/env bash
# Sauvegardes et restaurations de SAE501 (base MySQL et volumes d’uploads) sur le serveur.
#
# Usage :
#   backup.sh all                                  sauvegarde quotidienne des deux environnements (cron)
#   backup.sh db       <preprod|prod> [étiquette]   dump MySQL compressé
#   backup.sh uploads  <preprod|prod> [étiquette]   archive des volumes d’uploads publics et privés
#   backup.sh restore-db      <preprod|prod> <fichier.sql.gz> --yes
#   backup.sh restore-uploads <preprod|prod> <fichier.tar.gz> --yes
#   backup.sh offsite                              copie chiffrée hors du serveur (restic)
#   backup.sh offsite-snapshots                    liste des copies hors du serveur
#
# Option : --base-dir DIR (par défaut : dossier parent de ce script).
# Les fichiers sont écrits dans <base>/backups/<environnement>/ (droits 0600) et conservés
# BACKUP_RETENTION_DAYS jours (14 par défaut). Ils contiennent des données personnelles : si
# <base>/backups/offsite.env existe, « all » en envoie aussi une copie chiffrée par restic hors du
# serveur (voir DEPLOYMENT.md).
set -Eeuo pipefail
umask 077

readonly HELPER_IMAGE=alpine:3.22
readonly RESTIC_IMAGE=restic/restic:0.18.1
readonly RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-14}

log() { printf '[%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*" >&2; }
die() { log "ERREUR : $*"; exit 1; }
usage() { sed -n '2,18p' "$0" | sed 's/^# \{0,1\}//' >&2; exit 2; }

[[ $# -ge 1 ]] || usage
ACTION=$1; shift
POSITIONAL=()
BASE_DIR=$(cd "$(dirname "$0")/.." && pwd)
CONFIRMED=0
while [[ $# -gt 0 ]]; do
  case $1 in
    --base-dir) BASE_DIR=${2:?}; shift 2 ;;
    --yes) CONFIRMED=1; shift ;;
    -*) usage ;;
    *) POSITIONAL+=("$1"); shift ;;
  esac
done
[[ "$RETENTION_DAYS" =~ ^[0-9]+$ ]] || die "BACKUP_RETENTION_DAYS doit être un nombre de jours"

select_environment() {
  ENVIRONMENT=${1:-}
  case $ENVIRONMENT in preprod|prod) ;; *) usage ;; esac
  PROJECT="sae501-$ENVIRONMENT"
  ENV_DIR="$BASE_DIR/$ENVIRONMENT"
  BACKUP_DIR="$BASE_DIR/backups/$ENVIRONMENT"
  [[ -f "$ENV_DIR/.env" ]] || die "$ENV_DIR/.env absent"
  install -d -m 0700 "$BACKUP_DIR"
}

# Seul le service mysql est utilisé : les étiquettes d’images de l’application sont sans effet ici.
compose() {
  APP_IMAGE_TAG=unused \
    docker compose --project-directory "$ENV_DIR" --env-file "$ENV_DIR/.env" \
    -f "$ENV_DIR/docker-compose.prod.yml" "$@"
}

file_label() {
  local label=${1:-daily}
  [[ "$label" =~ ^[a-z0-9-]+$ ]] || die "étiquette invalide : $label"
  printf '%s-%s' "$label" "$(date -u +%Y%m%dT%H%M%SZ)"
}

# Le mot de passe root est lu dans le conteneur (MYSQL_PWD) : il n’apparaît ni dans la ligne de
# commande de l’hôte, ni dans les journaux.
# shellcheck disable=SC2016 # $MYSQL_* est développé dans le conteneur, pas sur l’hôte.
backup_db() {
  local target
  target="$BACKUP_DIR/db-$(file_label "${1:-}").sql.gz"
  compose exec -T mysql sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysqldump --user=root \
      --single-transaction --routines --triggers --no-tablespaces --add-drop-database \
      --databases "$MYSQL_DATABASE"' \
    | gzip -9 > "$target.partial"
  mv "$target.partial" "$target"
  log "base sauvegardée : $target"
}

backup_uploads() {
  local target
  target="$BACKUP_DIR/uploads-$(file_label "${1:-}").tar.gz"
  docker run --rm --network none \
    -v "${PROJECT}_backend_uploads:/backup/public:ro" \
    -v "${PROJECT}_backend_private_uploads:/backup/private:ro" \
    "$HELPER_IMAGE" tar -czf - -C /backup public private > "$target.partial"
  mv "$target.partial" "$target"
  log "uploads sauvegardés : $target"
}

rotate() {
  find "$BACKUP_DIR" -maxdepth 1 -type f \( -name '*.sql.gz' -o -name '*.tar.gz' \) \
    -mtime "+$RETENTION_DAYS" -delete
  find "$BACKUP_DIR" -maxdepth 1 -type f -name '*.partial' -mmin +120 -delete
}

# Copie hors du serveur : restic chiffre les sauvegardes avant envoi (AES-256) avec RESTIC_PASSWORD.
# offsite.env (0600) contient RESTIC_REPOSITORY, RESTIC_PASSWORD et les accès du stockage ; son
# contenu n’est jamais affiché. Un dépôt local (chemin absolu, disque externe) est monté tel quel.
restic_run() {
  local env_file="$BASE_DIR/backups/offsite.env" repository mounts=()
  [[ -f "$env_file" ]] || die "$env_file absent : copie hors du serveur non configurée"
  repository=$(sed -n 's/^RESTIC_REPOSITORY=//p' "$env_file" | tail -n 1)
  [[ -n "$repository" ]] || die "RESTIC_REPOSITORY absent de $env_file"
  if [[ "$repository" == /* ]]; then
    mounts=(-v "$repository:$repository")
  fi
  docker run --rm --env-file "$env_file" --hostname sae501 \
    -v "$BASE_DIR/backups:/backups:ro" "${mounts[@]}" "$RESTIC_IMAGE" "$@"
}

backup_offsite() {
  # Premier envoi : le dépôt chiffré est créé.
  if ! restic_run cat config >/dev/null 2>&1; then
    restic_run init >/dev/null
    log "dépôt hors du serveur initialisé"
  fi
  # offsite.env (mot de passe du dépôt et accès au stockage) ne quitte jamais le serveur.
  restic_run backup --quiet --tag sae501 --exclude '*.partial' --exclude 'backup.log' --exclude 'offsite.env' /backups
  restic_run forget --quiet --tag sae501 --keep-daily 14 --keep-weekly 8 --keep-monthly 12 --prune
  log "copie chiffrée hors du serveur envoyée"
}

require_confirmation() {
  [[ "$CONFIRMED" == 1 ]] || die "restauration destructive : relancer avec --yes"
}

case $ACTION in
  all)
    status=0
    for environment in preprod prod; do
      [[ -f "$BASE_DIR/$environment/.env" ]] || continue
      select_environment "$environment"
      # Un environnement jamais démarré n’a rien à sauvegarder.
      if ! docker volume inspect "${PROJECT}_mysql_data" >/dev/null 2>&1; then
        log "$PROJECT : pas encore déployé, ignoré"
        continue
      fi
      backup_db daily || status=1
      backup_uploads daily || status=1
      rotate
    done
    if [[ -f "$BASE_DIR/backups/offsite.env" ]]; then
      backup_offsite || status=1
    fi
    exit "$status"
    ;;
  offsite)
    backup_offsite
    ;;
  offsite-snapshots)
    restic_run snapshots --tag sae501
    ;;
  db)
    select_environment "${POSITIONAL[0]:-}"
    backup_db "${POSITIONAL[1]:-manual}"
    rotate
    ;;
  uploads)
    select_environment "${POSITIONAL[0]:-}"
    backup_uploads "${POSITIONAL[1]:-manual}"
    rotate
    ;;
  restore-db)
    select_environment "${POSITIONAL[0]:-}"
    source_file=${POSITIONAL[1]:-}
    [[ -f "$source_file" ]] || die "fichier de sauvegarde introuvable"
    require_confirmation
    # Le dump commence par DROP DATABASE puis CREATE DATABASE : la base est remplacée entièrement,
    # y compris les tables créées par des migrations postérieures à la sauvegarde.
    # shellcheck disable=SC2016 # $MYSQL_ROOT_PASSWORD est développé dans le conteneur.
    gunzip -c "$source_file" \
      | compose exec -T mysql sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysql --user=root'
    log "base de $PROJECT restaurée depuis $source_file"
    ;;
  restore-uploads)
    select_environment "${POSITIONAL[0]:-}"
    source_file=${POSITIONAL[1]:-}
    [[ -f "$source_file" ]] || die "fichier de sauvegarde introuvable"
    require_confirmation
    source_dir=$(cd "$(dirname "$source_file")" && pwd)
    docker run --rm --network none \
      -v "${PROJECT}_backend_uploads:/restore/public" \
      -v "${PROJECT}_backend_private_uploads:/restore/private" \
      -v "$source_dir:/source:ro" \
      "$HELPER_IMAGE" sh -c 'find /restore/public /restore/private -mindepth 1 -delete \
        && tar -xzf "/source/$1" -C /restore' restore "$(basename "$source_file")"
    log "uploads de $PROJECT restaurés depuis $source_file"
    ;;
  *) usage ;;
esac
