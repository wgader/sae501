<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\EquipmentCategory;
use App\Entity\User;
use App\Exception\EquipmentCategoryInUseException;
use App\Exception\SettingsValidationException;
use App\Service\AppSettingsService;
use App\Service\EquipmentCategoryService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Réglages par module : chaque agent ne modifie que ceux des modules qu'il gère, et
 * l'administrateur les hérite tous.
 */
final class SettingsAdministrationController extends AbstractController
{
    public function __construct(
        private readonly AppSettingsService $settings,
        private readonly EquipmentCategoryService $categories,
    ) {
    }

    #[Route('/api/admin/salles/settings', name: 'admin_settings_rooms_show', methods: ['GET'])]
    #[IsGranted('ROLE_GESTION_SALLE')]
    public function rooms(): JsonResponse
    {
        return $this->json($this->settings->serializeRooms());
    }

    #[Route('/api/admin/salles/settings', name: 'admin_settings_rooms_update', methods: ['PUT'])]
    #[IsGranted('ROLE_GESTION_SALLE')]
    public function updateRooms(Request $request, #[CurrentUser] User $agent): JsonResponse
    {
        return $this->handle(function () use ($request, $agent): array {
            $this->settings->updateRooms($this->payload($request), $agent);

            return $this->settings->serializeRooms();
        });
    }

    #[Route('/api/admin/equipment/settings', name: 'admin_settings_equipment_show', methods: ['GET'])]
    #[IsGranted('ROLE_GESTION_MATERIEL')]
    public function equipment(): JsonResponse
    {
        return $this->json($this->settings->serializeEquipment());
    }

    #[Route('/api/admin/equipment/settings', name: 'admin_settings_equipment_update', methods: ['PUT'])]
    #[IsGranted('ROLE_GESTION_MATERIEL')]
    public function updateEquipment(Request $request, #[CurrentUser] User $agent): JsonResponse
    {
        return $this->handle(function () use ($request, $agent): array {
            $this->settings->updateEquipment($this->payload($request), $agent);

            return $this->settings->serializeEquipment();
        });
    }

    #[Route('/api/admin/equipment/categories', name: 'admin_equipment_categories_list', methods: ['GET'])]
    #[IsGranted('ROLE_GESTION_MATERIEL')]
    public function categories(): JsonResponse
    {
        return $this->json(array_map($this->categories->serialize(...), $this->categories->list()));
    }

    #[Route('/api/admin/equipment/categories', name: 'admin_equipment_categories_create', methods: ['POST'])]
    #[IsGranted('ROLE_GESTION_MATERIEL')]
    public function createCategory(Request $request): JsonResponse
    {
        // Le catalogue de départ est créé avant toute nouvelle catégorie.
        $this->categories->list();

        return $this->handle(
            fn (): array => $this->categories->serialize($this->categories->create($this->payload($request)['label'] ?? null)),
            Response::HTTP_CREATED,
        );
    }

    #[Route('/api/admin/equipment/categories/{id}', name: 'admin_equipment_categories_rename', methods: ['PATCH'], requirements: ['id' => '\d+'])]
    #[IsGranted('ROLE_GESTION_MATERIEL')]
    public function renameCategory(EquipmentCategory $category, Request $request): JsonResponse
    {
        return $this->handle(
            fn (): array => $this->categories->serialize($this->categories->rename($category, $this->payload($request)['label'] ?? null)),
        );
    }

    #[Route('/api/admin/equipment/categories/{id}', name: 'admin_equipment_categories_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    #[IsGranted('ROLE_GESTION_MATERIEL')]
    public function deleteCategory(EquipmentCategory $category): JsonResponse
    {
        try {
            $this->categories->delete($category);
        } catch (EquipmentCategoryInUseException $exception) {
            return $this->json(
                ['message' => $exception->getMessage(), 'equipmentCount' => $exception->equipmentCount],
                Response::HTTP_CONFLICT,
            );
        } catch (SettingsValidationException $exception) {
            return $this->validationError($exception);
        }

        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
    }

    /**
     * @param callable(): array<string, mixed> $action
     */
    private function handle(callable $action, int $status = Response::HTTP_OK): JsonResponse
    {
        try {
            return $this->json($action(), $status);
        } catch (SettingsValidationException $exception) {
            return $this->validationError($exception);
        }
    }

    private function validationError(SettingsValidationException $exception): JsonResponse
    {
        return $this->json(
            ['message' => $exception->getMessage(), 'errors' => $exception->getErrors()],
            Response::HTTP_UNPROCESSABLE_ENTITY,
        );
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
