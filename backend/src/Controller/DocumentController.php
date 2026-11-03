<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\Routing\Attribute\Route;

final class DocumentController extends AbstractController
{
    public function __construct(
        #[Autowire('%kernel.project_dir%')]
        private readonly string $projectDir,
    ) {
    }

    #[Route('/uploads/documents/{filename}', name: 'app_document_serve', methods: ['GET', 'HEAD'])]
    public function serveDocument(string $filename): Response
    {
        // Protection contre le Directory Traversal (../)
        $cleanFilename = basename($filename);
        $filePath = $this->projectDir . '/public/uploads/documents/' . $cleanFilename;

        if (file_exists($filePath) && is_file($filePath) && is_readable($filePath)) {
            $response = new BinaryFileResponse($filePath);
            $response->setContentDisposition(ResponseHeaderBag::DISPOSITION_INLINE, $cleanFilename);
            return $response;
        }

        return new Response('Not Found', Response::HTTP_NOT_FOUND, [
            'Content-Type' => 'text/plain',
        ]);
    }
}
