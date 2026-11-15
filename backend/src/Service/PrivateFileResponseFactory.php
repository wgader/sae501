<?php

namespace App\Service;

use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;

final class PrivateFileResponseFactory
{
    /**
     * The caller must pass an absolute path already resolved by its storage and a MIME type
     * already checked against that storage's allowlist.
     */
    public function attachment(string $absolutePath, string $mimeType, ?string $downloadName, string $fallbackName): BinaryFileResponse
    {
        // Content-Disposition rejects path separators, which would otherwise end in an HTTP 500.
        $downloadName = trim(str_replace(['/', '\\'], '_', $downloadName ?? ''));
        if ('' === $downloadName) {
            $downloadName = $fallbackName;
        }

        $response = new BinaryFileResponse($absolutePath, Response::HTTP_OK, [], false);
        // Private files must never be kept by shared caches (proxy, CDN, WAF).
        $response->setCache(['private' => true, 'no_store' => true]);
        $response->headers->set('Content-Type', $mimeType);
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->setContentDisposition(ResponseHeaderBag::DISPOSITION_ATTACHMENT, $downloadName);

        return $response;
    }
}
