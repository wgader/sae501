<?php

declare(strict_types=1);

namespace App\Tests\Unit\Service;

use App\Service\AntivirusScanner;
use PHPUnit\Framework\TestCase;
use Psr\Log\NullLogger;

/**
 * Protocole INSTREAM de ClamAV, contre un faux démon qui signale tout fichier contenant
 * la chaîne de test EICAR.
 */
final class AntivirusScannerTest extends TestCase
{
    private string $directory;

    protected function setUp(): void
    {
        $this->directory = sys_get_temp_dir().'/clamav-test-'.bin2hex(random_bytes(4));
        mkdir($this->directory);
    }

    protected function tearDown(): void
    {
        array_map('unlink', glob($this->directory.'/*') ?: []);
        rmdir($this->directory);
    }

    public function testDisabledScannerAcceptsEverything(): void
    {
        $scanner = new AntivirusScanner(new NullLogger(), null);

        $scanner->assertClean($this->file('EICAR'));

        self::assertFalse($scanner->isEnabled());
    }

    public function testCleanFileIsAccepted(): void
    {
        $this->withFakeDaemon(function (string $dsn): void {
            (new AntivirusScanner(new NullLogger(), $dsn))->assertClean($this->file(str_repeat('contenu sain ', 2000)));
        });
        $this->addToAssertionCount(1);
    }

    public function testInfectedFileIsRefused(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Le fichier a été refusé par l’antivirus.');

        $this->withFakeDaemon(function (string $dsn): void {
            (new AntivirusScanner(new NullLogger(), $dsn))->assertClean($this->file('X5O!P%@AP EICAR-STANDARD-ANTIVIRUS-TEST-FILE'));
        });
    }

    public function testUnavailableDaemonBlocksTheUpload(): void
    {
        $this->expectException(\RuntimeException::class);

        (new AntivirusScanner(new NullLogger(), 'unix://'.$this->directory.'/absent.sock'))->assertClean($this->file('contenu'));
    }

    private function file(string $content): string
    {
        $path = $this->directory.'/'.bin2hex(random_bytes(4)).'.bin';
        file_put_contents($path, $content);

        return $path;
    }

    /**
     * Lance un faux clamd sur un socket Unix pour une seule analyse.
     */
    private function withFakeDaemon(callable $test): void
    {
        $socket = $this->directory.'/clamd.sock';
        $script = $this->directory.'/daemon.php';
        file_put_contents($script, <<<'PHP'
            <?php
            $server = stream_socket_server('unix://'.$argv[1]);
            $client = stream_socket_accept($server, 10);
            fread($client, 10); // zINSTREAM\0
            $data = '';
            while (true) {
                $length = unpack('N', fread($client, 4))[1];
                if (0 === $length) { break; }
                $chunk = '';
                while (strlen($chunk) < $length) { $chunk .= fread($client, $length - strlen($chunk)); }
                $data .= $chunk;
            }
            fwrite($client, str_contains($data, 'EICAR') ? "stream: Eicar-Signature FOUND\0" : "stream: OK\0");
            fclose($client);
            PHP);
        $process = proc_open([\PHP_BINARY, $script, $socket], [], $pipes);
        for ($attempt = 0; $attempt < 50 && !file_exists($socket); ++$attempt) {
            usleep(20000);
        }

        try {
            $test('unix://'.$socket);
        } finally {
            proc_close($process);
        }
    }
}
