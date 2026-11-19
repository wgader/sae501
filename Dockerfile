# syntax=docker/dockerfile:1

# Une seule image pour toute l'application : le front Next.js, exporté en fichiers statiques,
# est servi par Caddy (intégré à FrankenPHP) à côté de l'API Symfony.
#
#   docker build -t sae501 .                 image de production (stage app)
#   docker compose up                        développement (stage dev, voir docker-compose.yml)

# ── 1. Front : export statique Next.js ───────────────────────────────────────
FROM node:26-alpine AS frontend-builder
WORKDIR /src
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
# next build produit out/, puis scripts/add-csp.mjs ajoute la CSP à chaque page.
RUN npm run build

# ── Base PHP commune au développement et à la production ─────────────────────
FROM dunglas/frankenphp:1.13.5-php8.5-alpine AS php-base
RUN install-php-extensions intl zip opcache pdo_mysql
COPY docker/php.ini $PHP_INI_DIR/conf.d/app.ini
COPY docker/Caddyfile /etc/frankenphp/Caddyfile
WORKDIR /app/backend

# ── 2. Back : dépendances Composer de production ─────────────────────────────
FROM php-base AS backend-builder
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY backend/composer.json backend/composer.lock backend/symfony.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-progress
COPY backend/ .
RUN composer dump-autoload --no-dev --classmap-authoritative \
 && APP_ENV=prod php bin/console assets:install public --no-interaction

# ── Développement : les sources sont montées par docker-compose.yml ──────────
FROM php-base AS dev
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY backend/composer.json backend/composer.lock backend/symfony.lock ./
RUN composer install --no-scripts --prefer-dist --no-progress
EXPOSE 80

# ── 3. Production ────────────────────────────────────────────────────────────
FROM php-base AS app

# UID fixe : les scripts du serveur donnent à cet utilisateur la lecture des clés JWT.
ARG APP_UID=10001
ARG APP_GID=10001

ENV APP_ENV=prod \
    APP_DEBUG=0 \
    SERVER_NAME=:80

# Sans root, FrankenPHP a besoin de cette capacité pour écouter sur le port 80.
RUN addgroup -S -g "${APP_GID}" app \
 && adduser -S -D -H -u "${APP_UID}" -G app -s /sbin/nologin app \
 && setcap CAP_NET_BIND_SERVICE=+eip /usr/local/bin/frankenphp

# Le code appartient à root : l'application ne peut pas le modifier.
COPY --from=backend-builder /app/backend ./
COPY --from=frontend-builder /src/out ./public/

# Seuls var/ (cache, images, justificatifs) et l'état de Caddy restent modifiables.
RUN mkdir -p var/media var/uploads \
 && chown -R "${APP_UID}:${APP_GID}" var /data /config

USER ${APP_UID}:${APP_GID}

# Préparé au build : une erreur de configuration bloque l'image avant le déploiement.
RUN php bin/console cache:warmup --no-interaction

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=5 \
    CMD ["curl", "--fail", "--silent", "--output", "/dev/null", "http://localhost/healthcheck.php"]
