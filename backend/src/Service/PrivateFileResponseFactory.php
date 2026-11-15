<?php

namespace App\Service;

use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;

final class PrivateFileResponseFactory
{
    /**
     * L’appelant fournit un chemin absolu déjà résolu par son stockage et un type MIME
     * déjà vérifié par la liste blanche de ce stockage.
     */
    public function attachment(string $absolutePath, string $mimeType, ?string $downloadName, string $fallbackName): BinaryFileResponse
    {
        // Content-Disposition refuse les séparateurs de chemin, qui provoqueraient sinon une erreur HTTP 500.
        $downloadName = trim(str_replace(['/', '\\'], '_', $downloadName ?? ''));
        if ('' === $downloadName) {
            $downloadName = $fallbackName;
        }

        $response = new BinaryFileResponse($absolutePath, Response::HTTP_OK, [], false);
        // Un fichier privé ne doit jamais être conservé par un cache partagé (proxy, CDN, WAF).
        $response->setCache(['private' => true, 'no_store' => true]);
        $response->headers->set('Content-Type', $mimeType);
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->setContentDisposition(ResponseHeaderBag::DISPOSITION_ATTACHMENT, $downloadName);

        return $response;
    }
}
