<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\FaqItem;
use App\Entity\GrantDocumentType;
use App\Entity\GrantResource;
use App\Entity\User;
use App\Exception\SettingsValidationException;
use App\Service\FaqService;
use App\Service\GrantConfigService;
use App\Service\LegalContentService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/admin/content')]
final class AdminContentController extends AbstractController
{
    public function __construct(
        private readonly FaqService $faqService,
        private readonly LegalContentService $legalContentService,
        private readonly GrantConfigService $grantConfigService,
    ) {
    }

    // --- FAQ (Accessible par tous les agents mairie / admin) ---

    #[Route('/faq', name: 'admin_faq_list', methods: ['GET'])]
    #[IsGranted('ROLE_MAIRIE')]
    public function listFaq(): JsonResponse
    {
        return $this->json($this->faqService->listAll());
    }

    #[Route('/faq', name: 'admin_faq_create', methods: ['POST'])]
    #[IsGranted('ROLE_MAIRIE')]
    public function createFaq(Request $request): JsonResponse
    {
        $payload = $this->payload($request);

        return $this->handle(
            fn (): array => $this->faqService->serialize(
                $this->faqService->create(
                    $payload['question'] ?? null,
                    $payload['answer'] ?? null,
                    (int) ($payload['displayOrder'] ?? 0),
                )
            ),
            Response::HTTP_CREATED
        );
    }

    #[Route('/faq/{id}', name: 'admin_faq_update', requirements: ['id' => '\d+'], methods: ['PUT', 'PATCH'])]
    #[IsGranted('ROLE_MAIRIE')]
    public function updateFaq(FaqItem $item, Request $request): JsonResponse
    {
        $payload = $this->payload($request);

        return $this->handle(
            fn (): array => $this->faqService->serialize(
                $this->faqService->update(
                    $item,
                    $payload['question'] ?? null,
                    $payload['answer'] ?? null,
                    isset($payload['displayOrder']) ? (int) $payload['displayOrder'] : null,
                )
            )
        );
    }

    #[Route('/faq/{id}', name: 'admin_faq_delete', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    #[IsGranted('ROLE_MAIRIE')]
    public function deleteFaq(FaqItem $item): JsonResponse
    {
        $this->faqService->delete($item);

        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
    }

    // --- LÉGAL & CGU (Accessible par ROLE_ADMIN ou ROLE_MAIRIE) ---

    #[Route('/legal/{type}', name: 'admin_legal_show', requirements: ['type' => 'cgu|mentions_legales'], methods: ['GET'])]
    #[IsGranted('ROLE_MAIRIE')]
    public function showLegal(string $type): JsonResponse
    {
        return $this->json($this->legalContentService->get($type));
    }

    #[Route('/legal/{type}', name: 'admin_legal_update', requirements: ['type' => 'cgu|mentions_legales'], methods: ['PUT', 'PATCH'])]
    #[IsGranted('ROLE_MAIRIE')]
    public function updateLegal(string $type, Request $request, #[CurrentUser] User $agent): JsonResponse

    {
        $payload = $this->payload($request);

        return $this->handle(
            fn (): array => $this->legalContentService->update($type, $payload, $agent)
        );
    }

    // --- SUBVENTIONS : Types de documents requis (ROLE_GESTION_SUBVENTION) ---

    #[Route('/grants/document-types', name: 'admin_grant_document_types_list', methods: ['GET'])]
    #[IsGranted('ROLE_GESTION_SUBVENTION')]
    public function listGrantDocumentTypes(): JsonResponse
    {
        return $this->json($this->grantConfigService->listDocumentTypes());
    }

    #[Route('/grants/document-types', name: 'admin_grant_document_types_create', methods: ['POST'])]
    #[IsGranted('ROLE_GESTION_SUBVENTION')]
    public function createGrantDocumentType(Request $request): JsonResponse
    {
        $payload = $this->payload($request);

        return $this->handle(
            fn (): array => $this->grantConfigService->serializeDocumentType(
                $this->grantConfigService->createDocumentType(
                    $payload['label'] ?? null,
                    (bool) ($payload['isRequired'] ?? false),
                    (int) ($payload['displayOrder'] ?? 0)
                )
            ),
            Response::HTTP_CREATED
        );
    }

    #[Route('/grants/document-types/{id}', name: 'admin_grant_document_types_update', requirements: ['id' => '\d+'], methods: ['PUT', 'PATCH'])]
    #[IsGranted('ROLE_GESTION_SUBVENTION')]
    public function updateGrantDocumentType(GrantDocumentType $type, Request $request): JsonResponse
    {
        $payload = $this->payload($request);

        return $this->handle(
            fn (): array => $this->grantConfigService->serializeDocumentType(
                $this->grantConfigService->updateDocumentType(
                    $type,
                    $payload['label'] ?? null,
                    isset($payload['isRequired']) ? (bool) $payload['isRequired'] : null,
                    isset($payload['displayOrder']) ? (int) $payload['displayOrder'] : null
                )
            )
        );
    }

    #[Route('/grants/document-types/{id}', name: 'admin_grant_document_types_delete', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    #[IsGranted('ROLE_GESTION_SUBVENTION')]
    public function deleteGrantDocumentType(GrantDocumentType $type): JsonResponse
    {
        $this->grantConfigService->deleteDocumentType($type);

        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
    }

    // --- SUBVENTIONS : Fichiers modèles et ressources (ROLE_GESTION_SUBVENTION) ---

    #[Route('/grants/resources', name: 'admin_grant_resources_list', methods: ['GET'])]
    #[IsGranted('ROLE_GESTION_SUBVENTION')]
    public function listGrantResources(): JsonResponse
    {
        return $this->json($this->grantConfigService->listResources());
    }

    #[Route('/grants/resources', name: 'admin_grant_resources_create', methods: ['POST'])]
    #[IsGranted('ROLE_GESTION_SUBVENTION')]
    public function createGrantResource(Request $request): JsonResponse
    {
        $payload = $this->payload($request);

        return $this->handle(
            fn (): array => $this->grantConfigService->serializeResource(
                $this->grantConfigService->createResource(
                    $payload['label'] ?? null,
                    $payload['url'] ?? null,
                    (bool) ($payload['isExternal'] ?? false),
                    (int) ($payload['displayOrder'] ?? 0)
                )
            ),
            Response::HTTP_CREATED
        );
    }

    #[Route('/grants/resources/{id}', name: 'admin_grant_resources_update', requirements: ['id' => '\d+'], methods: ['PUT', 'PATCH'])]
    #[IsGranted('ROLE_GESTION_SUBVENTION')]
    public function updateGrantResource(GrantResource $resource, Request $request): JsonResponse
    {
        $payload = $this->payload($request);

        return $this->handle(
            fn (): array => $this->grantConfigService->serializeResource(
                $this->grantConfigService->updateResource(
                    $resource,
                    $payload['label'] ?? null,
                    $payload['url'] ?? null,
                    isset($payload['isExternal']) ? (bool) $payload['isExternal'] : null,
                    isset($payload['displayOrder']) ? (int) $payload['displayOrder'] : null
                )
            )
        );
    }

    #[Route('/grants/resources/{id}', name: 'admin_grant_resources_delete', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    #[IsGranted('ROLE_GESTION_SUBVENTION')]
    public function deleteGrantResource(GrantResource $resource): JsonResponse
    {
        $this->grantConfigService->deleteResource($resource);

        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
    }

    // --- Helpers ---

    /**
     * @param callable(): array<string, mixed> $action
     */
    private function handle(callable $action, int $status = Response::HTTP_OK): JsonResponse
    {
        try {
            return $this->json($action(), $status);
        } catch (SettingsValidationException $exception) {
            return $this->json(
                ['message' => $exception->getMessage(), 'errors' => $exception->getErrors()],
                Response::HTTP_UNPROCESSABLE_ENTITY
            );
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(Request $request): array
    {
        try {
            $payload = $request->toArray();
        } catch (\Throwable) {
            throw new SettingsValidationException(['body' => 'Le corps de la requête doit être un objet JSON.']);
        }

        return $payload;
    }
}
