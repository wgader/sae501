<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\Association;
use App\Entity\DemandeSubvention;
use App\Entity\User;
use App\Repository\DemandeSubventionRepository;
use App\Service\SubventionDraftDocumentService;
use App\Service\GrantStatusNotifier;
use App\Service\SubventionDraftService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/grants')]
#[IsGranted('ROLE_ASSOCIATION')]
final class SubventionDraftController extends AbstractController
{
    public function __construct(
        private readonly SubventionDraftService $draftService,
        private readonly SubventionDraftDocumentService $documentService,
        private readonly DemandeSubventionRepository $subventionRepository,
        private readonly GrantStatusNotifier $statusNotifier,
    ) {
    }

    /** Dossiers déjà transmis à la mairie, avec leur statut. */
    #[Route('', name: 'app_grant_submitted_list', methods: ['GET'])]
    public function submitted(#[CurrentUser] User $user): JsonResponse
    {
        $association = $user->getAssociation();
        if (null === $association || !$association->isModuleSubventionActif()) {
            return $this->forbidden();
        }

        return $this->json($this->draftService->getSubmitted($association));
    }

    #[Route('/{id}/submit', name: 'app_grant_draft_submit', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function submit(int $id, #[CurrentUser] User $user): JsonResponse
    {
        $association = $user->getAssociation();
        if (null === $association || !$association->isModuleSubventionActif()) {
            return $this->forbidden();
        }

        $draft = $this->findOwnedDraft($id, $association);
        if ($draft instanceof JsonResponse) {
            return $draft;
        }

        try {
            $this->draftService->submit($draft, count($this->documentService->listDocuments($draft)));
        } catch (\InvalidArgumentException $exception) {
            return $this->json(['message' => $exception->getMessage()], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $this->statusNotifier->notifySubmitted($draft);

        return $this->json(SubventionDraftService::serializeSubmitted($draft));
    }

    #[Route('/drafts', name: 'app_grant_drafts_list', methods: ['GET'])]
    public function list(#[CurrentUser] User $user): JsonResponse
    {
        $association = $user->getAssociation();
        if (null === $association || !$association->isModuleSubventionActif()) {
            return $this->forbidden();
        }

        return $this->json($this->draftService->getDrafts($association));
    }

    #[Route('', name: 'app_grant_draft_create', methods: ['POST'])]
    public function create(Request $request, #[CurrentUser] User $user): JsonResponse
    {
        $association = $user->getAssociation();
        if (null === $association || !$association->isModuleSubventionActif()) {
            return $this->forbidden();
        }
        $payload = $this->decodePayload($request);
        if ($payload instanceof JsonResponse) {
            return $payload;
        }

        try {
            $draft = $this->draftService->saveDraft($association, null, $payload);

            return $this->json(SubventionDraftService::serialize($draft), Response::HTTP_CREATED);
        } catch (\InvalidArgumentException $exception) {
            return $this->json(['message' => $exception->getMessage()], Response::HTTP_UNPROCESSABLE_ENTITY);
        }
    }

    #[Route('/{id}/draft', name: 'app_grant_draft_update', requirements: ['id' => '\d+'], methods: ['PUT'])]
    public function update(int $id, Request $request, #[CurrentUser] User $user): JsonResponse
    {
        $association = $user->getAssociation();
        if (null === $association || !$association->isModuleSubventionActif()) {
            return $this->forbidden();
        }

        $draft = $this->findOwnedDraft($id, $association);
        if ($draft instanceof JsonResponse) {
            return $draft;
        }

        $payload = $this->decodePayload($request);
        if ($payload instanceof JsonResponse) {
            return $payload;
        }

        try {
            $draft = $this->draftService->saveDraft($association, $draft, $payload);

            return $this->json(SubventionDraftService::serialize($draft));
        } catch (\InvalidArgumentException $exception) {
            return $this->json(['message' => $exception->getMessage()], Response::HTTP_UNPROCESSABLE_ENTITY);
        }
    }

    #[Route(
        '/{id}/validate-budget',
        name: 'app_grant_draft_validate_budget',
        requirements: ['id' => '\d+'],
        methods: ['POST'],
    )]
    public function validateBudget(int $id, #[CurrentUser] User $user): JsonResponse
    {
        $association = $user->getAssociation();
        if (null === $association || !$association->isModuleSubventionActif()) {
            return $this->forbidden();
        }

        $draft = $this->findOwnedDraft($id, $association);
        if ($draft instanceof JsonResponse) {
            return $draft;
        }

        try {
            $this->draftService->validateBudget($draft);

            return $this->json(SubventionDraftService::serialize($draft));
        } catch (\InvalidArgumentException $exception) {
            return $this->json(['message' => $exception->getMessage()], Response::HTTP_UNPROCESSABLE_ENTITY);
        }
    }

    #[Route(
        '/{id}/documents',
        name: 'app_grant_draft_documents_list',
        requirements: ['id' => '\d+'],
        methods: ['GET'],
    )]
    public function documents(int $id, #[CurrentUser] User $user): JsonResponse
    {
        $association = $user->getAssociation();
        if (null === $association || !$association->isModuleSubventionActif()) {
            return $this->forbidden();
        }

        $draft = $this->findOwnedDraft($id, $association);
        if ($draft instanceof JsonResponse) {
            return $draft;
        }
        return $this->json($this->documentService->listDocuments($draft));
    }

    #[Route(
        '/{id}/documents',
        name: 'app_grant_draft_document_upload',
        requirements: ['id' => '\d+'],
        methods: ['POST'],
    )]
    public function uploadDocument(int $id, Request $request, #[CurrentUser] User $user): JsonResponse
    {
        $association = $user->getAssociation();
        if (null === $association || !$association->isModuleSubventionActif()) {
            return $this->forbidden();
        }

        $draft = $this->findOwnedDraft($id, $association);
        if ($draft instanceof JsonResponse) {
            return $draft;
        }
        $file = $request->files->get('file');
        if (!$file instanceof UploadedFile) {
            return $this->json(['message' => 'Fichier invalide ou manquant.'], Response::HTTP_BAD_REQUEST);
        }

        $typeDocument = $request->request->get('typeDocument');
        if (!is_string($typeDocument)) {
            return $this->json(['message' => 'Le type de justificatif est obligatoire.'], Response::HTTP_BAD_REQUEST);
        }

        try {
            return $this->json(
                $this->documentService->upload($association, $draft, $file, $typeDocument),
                Response::HTTP_CREATED,
            );
        } catch (\InvalidArgumentException $exception) {
            return $this->json(['message' => $exception->getMessage()], Response::HTTP_UNPROCESSABLE_ENTITY);
        } catch (\RuntimeException $exception) {
            return $this->json(['message' => $exception->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    private function forbidden(): JsonResponse
    {
        return $this->json(
            ['message' => 'Le module subventions n’est pas activé pour votre association.'],
            Response::HTTP_FORBIDDEN,
        );
    }

    private function findOwnedDraft(int $id, Association $association): DemandeSubvention|JsonResponse
    {
        $draft = $this->subventionRepository->find($id);
        if (null === $draft) {
            return $this->json(['message' => 'Brouillon introuvable.'], Response::HTTP_NOT_FOUND);
        }
        if ($draft->getAssociation()?->getId() !== $association->getId()) {
            return $this->json(['message' => 'Ce brouillon ne vous appartient pas.'], Response::HTTP_FORBIDDEN);
        }
        if ('Brouillon' !== $draft->getStatut()) {
            return $this->json(['message' => 'Seuls les brouillons peuvent être modifiés.'], Response::HTTP_CONFLICT);
        }

        return $draft;
    }

    /**
     * @return array<string, mixed>|JsonResponse
     */
    private function decodePayload(Request $request): array|JsonResponse
    {
        $payload = json_decode($request->getContent(), true);
        if (!is_array($payload)) {
            return $this->json(['message' => 'Le corps de la requête est invalide.'], Response::HTTP_BAD_REQUEST);
        }

        return $payload;
    }
}
