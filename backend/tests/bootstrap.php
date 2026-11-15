<?php

use Symfony\Component\Dotenv\Dotenv;

require dirname(__DIR__).'/vendor/autoload.php';

if (method_exists(Dotenv::class, 'bootEnv')) {
    (new Dotenv())->bootEnv(dirname(__DIR__).'/.env');
}

// Disposable, unencrypted keys used only by the test suite (see when@test in
// config/packages/lexik_jwt_authentication.yaml). They live in the test cache,
// which is ignored by Git and Docker, and are recreated when the cache is cleared.
(static function (string $keyDirectory): void {
    $privateKeyPath = $keyDirectory.'/private.pem';
    $publicKeyPath = $keyDirectory.'/public.pem';
    if (is_file($privateKeyPath) && is_file($publicKeyPath)) {
        return;
    }

    if (!is_dir($keyDirectory) && !mkdir($keyDirectory, 0700, true) && !is_dir($keyDirectory)) {
        throw new RuntimeException('Unable to create the test JWT key directory.');
    }

    $key = openssl_pkey_new([
        'private_key_type' => OPENSSL_KEYTYPE_RSA,
        'private_key_bits' => 2048,
    ]);
    $details = false === $key ? false : openssl_pkey_get_details($key);
    if (false === $key || false === $details || !openssl_pkey_export($key, $privateKey)) {
        throw new RuntimeException('Unable to generate the test JWT key pair.');
    }

    file_put_contents($privateKeyPath, $privateKey, LOCK_EX);
    chmod($privateKeyPath, 0600);
    file_put_contents($publicKeyPath, $details['key'], LOCK_EX);
})(dirname(__DIR__).'/var/cache/test/jwt');

if ($_SERVER['APP_DEBUG']) {
    umask(0000);
}
