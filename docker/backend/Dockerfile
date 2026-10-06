FROM dunglas/frankenphp:1.12-php8.5-alpine

COPY docker/backend/php.ini /usr/local/etc/php/conf.d/custom.ini
COPY docker/backend/Caddyfile /etc/caddy/Caddyfile

RUN install-php-extensions \
    intl \
    zip \
    opcache \
    pdo_mysql \
    @composer

WORKDIR /app

COPY backend/composer.json backend/composer.lock backend/symfony.lock* ./
RUN composer install \
    --no-dev \
    --no-scripts \
    --no-autoloader \
    --prefer-dist

COPY backend/ .

RUN composer dump-autoload --optimize

EXPOSE 80 443