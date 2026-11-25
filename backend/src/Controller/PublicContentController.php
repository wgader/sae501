<?php

declare(strict_types=1);

namespace App\Controller;

use App\Service\FaqService;
use App\Service\GrantConfigService;
use App\Service\LegalContentService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/public')]
final class PublicContentController extends AbstractController
{
    public function __construct(
        private readonly FaqService $faqService,
        private readonly LegalContentService $legalContentService,
        private readonly GrantConfigService $grantConfigService,
    ) {
    }

    #[Route('/faq', name: 'public_faq_list', methods: ['GET'])]
    public function faq(): JsonResponse
    {
        return $this->json($this->faqService->listAll());
    }

    #[Route('/legal/{type}', name: 'public_legal_show', requirements: ['type' => 'cgu|mentions_legales'], methods: ['GET'])]
    public function legal(string $type): JsonResponse
    {
        return $this->json($this->legalContentService->get($type));
    }

    #[Route('/grants/resources', name: 'public_grants_resources', methods: ['GET'])]
    public function grantResources(): JsonResponse
    {
        return $this->json($this->grantConfigService->listResources());
    }

    #[Route('/grants/document-types', name: 'public_grants_document_types', methods: ['GET'])]
    public function grantDocumentTypes(): JsonResponse
    {
        return $this->json($this->grantConfigService->listDocumentTypes());
    }
}
