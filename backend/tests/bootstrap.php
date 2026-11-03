<?php

use Symfony\Component\Dotenv\Dotenv;

require dirname(__DIR__).'/vendor/autoload.php';

if (method_exists(Dotenv::class, 'bootEnv')) {
    (new Dotenv())->bootEnv(dirname(__DIR__).'/.env');
}

// Résolution automatique du chemin des clés JWT en local si /app n'existe pas
if (!file_exists($_SERVER['JWT_SECRET_KEY'] ?? '') && file_exists(dirname(__DIR__) . '/config/jwt/private.pem')) {
    $_SERVER['JWT_SECRET_KEY'] = dirname(__DIR__) . '/config/jwt/private.pem';
    $_ENV['JWT_SECRET_KEY'] = dirname(__DIR__) . '/config/jwt/private.pem';
    $_SERVER['JWT_PUBLIC_KEY'] = dirname(__DIR__) . '/config/jwt/public.pem';
    $_ENV['JWT_PUBLIC_KEY'] = dirname(__DIR__) . '/config/jwt/public.pem';
}

if ($_SERVER['APP_DEBUG']) {
    umask(0000);
}
