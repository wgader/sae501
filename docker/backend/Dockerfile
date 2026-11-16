# syntax=docker/dockerfile:1

# ── Base commune : FrankenPHP, extensions PHP et configuration ─────────────────
FROM dunglas/frankenphp:1.13.5-php8.5-alpine AS base

# Identifiants fixes : les scripts du serveur (bootstrap, sauvegardes) donnent à cet UID
# la lecture des clés JWT montées en secrets Docker.
ARG APP_UID=10001
ARG APP_GID=10001

COPY docker/backend/php.ini /usr/local/etc/php/conf.d/custom.ini
COPY docker/backend/Caddyfile /etc/caddy/Caddyfile

RUN install-php-extensions \
    intl \
    zip \
    opcache \
    pdo_mysql \
    @composer

WORKDIR /app

# ── Développement : dépendances complètes, sources montées par docker-compose.yml ─
# Ce stage reste root : le dossier ./backend de l’hôte est monté sur /app et Symfony
# doit pouvoir y écrire var/ quel que soit le propriétaire des fichiers de l’hôte.
FROM base AS dev

COPY backend/composer.json backend/composer.lock backend/symfony.lock* ./
RUN composer install \
    --no-scripts \
    --no-autoloader \
    --prefer-dist \
    --no-progress

COPY backend/ .
RUN composer dump-autoload --optimize

EXPOSE 80 443

# ── Dépendances de production, sans paquets de développement ──────────────────
FROM base AS vendor

COPY backend/composer.json backend/composer.lock backend/symfony.lock* ./
RUN composer install \
    --no-dev \
    --no-scripts \
    --no-autoloader \
    --prefer-dist \
    --no-progress

COPY backend/ .
RUN composer dump-autoload --no-dev --optimize --classmap-authoritative

# ── Production : utilisateur non privilégié, sources en lecture seule ──────────
FROM base AS prod

ARG APP_UID
ARG APP_GID

ENV APP_ENV=prod \
    SERVER_NAME=:80 \
    APP_DEBUG=0

# Composer ne sert qu’au build : il n’a pas sa place dans l’image exécutée.
# La capacité CAP_NET_BIND_SERVICE permet à FrankenPHP d’écouter sur 80/443 sans root
# (méthode de la documentation FrankenPHP pour une image rootless).
RUN rm -f /usr/local/bin/composer \
 && addgroup -S -g "${APP_GID}" app \
 && adduser -S -D -H -u "${APP_UID}" -G app -s /sbin/nologin app \
 && setcap CAP_NET_BIND_SERVICE=+eip /usr/local/bin/frankenphp

# Les sources appartiennent à root : l’application ne peut pas modifier son propre code.
COPY --from=vendor /app /app

# Seuls var/ (cache, logs, justificatifs privés), public/uploads (images publiques),
# /data et /config (état de Caddy) sont accessibles en écriture.
RUN mkdir -p /app/var/uploads /app/public/uploads \
 && chown -R "${APP_UID}:${APP_GID}" /app/var /app/public/uploads /data /config

USER ${APP_UID}:${APP_GID}

# Cache Symfony préparé au build : démarrage plus rapide et erreur de configuration détectée
# avant la publication de l’image. Les variables d’environnement restent lues à l’exécution.
RUN php bin/console cache:warmup --no-interaction

EXPOSE 80 443

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=5 \
    CMD ["curl", "--fail", "--silent", "--show-error", "--output", "/dev/null", "http://localhost/healthcheck.php"]
