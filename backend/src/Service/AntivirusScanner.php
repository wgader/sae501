<?php

declare(strict_types=1);

namespace App\Service;

use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * Analyse antivirus des fichiers déposés par le démon ClamAV (protocole INSTREAM).
 *
 * Facultative : sans CLAMAV_DSN (par exemple « tcp://clamav:3310 »), aucun fichier n’est analysé.
 * Configurée, elle est bloquante : un fichier infecté est refusé, et si ClamAV ne répond pas le
 * dépôt est refusé plutôt qu’enregistré sans analyse.
 */
final class AntivirusScanner
{
    private const CHUNK_SIZE = 8192;
    private const TIMEOUT_SECONDS = 30;

    public function __construct(
        private readonly LoggerInterface $logger,
        #[Autowire(env: 'default::CLAMAV_DSN')]
        private readonly ?string $dsn = null,
    ) {
    }

    public function isEnabled(): bool
    {
        return null !== $this->dsn && '' !== trim($this->dsn);
    }

    /**
     * @throws \InvalidArgumentException si le fichier est infecté
     * @throws \RuntimeException         si l’antivirus est configuré mais indisponible
     */
    public function assertClean(string $path): void
    {
        if (!$this->isEnabled()) {
            return;
        }

        $reply = $this->scan($path);
        if (str_ends_with($reply, ' OK')) {
            return;
        }
        if (str_ends_with($reply, ' FOUND')) {
            $this->logger->warning('antivirus: fichier refusé', ['signature' => trim(substr($reply, (int) strpos($reply, ':') + 1, -6))]);

            throw new \InvalidArgumentException('Le fichier a été refusé par l’antivirus.');
        }

        $this->logger->error('antivirus: réponse inattendue', ['reply' => $reply]);
        throw new \RuntimeException('L’analyse antivirus a échoué : réessayez plus tard.');
    }

    private function scan(string $path): string
    {
        $socket = @stream_socket_client((string) $this->dsn, $errorCode, $errorMessage, 5);
        $file = @fopen($path, 'rb');
        if (false === $socket || false === $file) {
            $this->logger->error('antivirus: indisponible', ['error' => $errorMessage ?? 'fichier illisible']);
            if (false !== $socket) {
                fclose($socket);
            }
            throw new \RuntimeException('L’analyse antivirus est indisponible : réessayez plus tard.');
        }

        try {
            stream_set_timeout($socket, self::TIMEOUT_SECONDS);
            fwrite($socket, "zINSTREAM\0");
            while (!feof($file)) {
                $chunk = (string) fread($file, self::CHUNK_SIZE);
                if ('' !== $chunk) {
                    fwrite($socket, pack('N', \strlen($chunk)).$chunk);
                }
            }
            fwrite($socket, pack('N', 0));

            return trim((string) stream_get_contents($socket), "\0\n ");
        } finally {
            fclose($file);
            fclose($socket);
        }
    }
}
