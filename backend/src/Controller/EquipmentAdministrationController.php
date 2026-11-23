<?php

namespace App\Controller;

use App\Entity\Materiel;
use App\Entity\StockAdjustment;
use App\Entity\User;
use App\Exception\StockConflictException;
use App\Repository\MaterielRepository;
use App\Repository\StockAdjustmentRepository;
use App\Service\EquipmentStockService;
use App\Service\PublicImageStorage;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\ExpressionLanguage\Expression;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/admin/equipment')]
#[IsGranted(new Expression("is_granted('ROLE_ADMIN') or is_granted('ROLE_GESTION_MATERIEL')"))]
final class EquipmentAdministrationController extends AbstractController
{
    private const IMAGE_FOLDER = 'equipment';

    public function __construct(
        private readonly MaterielRepository $materielRepository,
        private readonly StockAdjustmentRepository $stockAdjustmentRepository,
        private readonly EquipmentStockService $stockService,
        private readonly EntityManagerInterface $entityManager,
        private readonly PublicImageStorage $imageStorage,
    ) {
    }

    #[Route('', name: 'admin_equipment_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $category = $request->query->get('category');
        $archivedParam = $request->query->get('archived');
        $isArchived = null;
        if ($archivedParam !== null) {
            $isArchived = filter_var($archivedParam, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        }

        $items = $this->materielRepository->findForAdministration(
            category: is_string($category) ? $category : null,
            isArchived: $isArchived,
        );

        return $this->json(array_map(
            static fn (Materiel $m): array => self::serializeEquipment($m),
            $items,
        ));
    }

    #[Route('/{id}', name: 'admin_equipment_show', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function show(Materiel $materiel): JsonResponse
    {
        return $this->json(self::serializeEquipment($materiel));
    }

    #[Route('', name: 'admin_equipment_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $payload = $this->requestPayload($request);
        $image = $request->files->get('photo') ?? $request->files->get('image');

        $errors = [];

        $designation = trim((string) ($payload['designation'] ?? ''));
        if ($designation === '') {
            $errors['designation'] = 'La désignation du matériel est obligatoire.';
        }

        $categorie = trim((string) ($payload['categorie'] ?? ''));
        if ($categorie === '') {
            $errors['categorie'] = 'La catégorie est obligatoire.';
        }

        $rawStock = $payload['stockTotal'] ?? $payload['quantiteTotale'] ?? null;
        if ($rawStock === null || (!is_int($rawStock) && !ctype_digit((string) $rawStock))) {
            $errors['stockTotal'] = 'Le stock doit être un entier positif ou nul.';
        } else {
            $stock = (int) $rawStock;
            if ($stock <= 0) {
                $errors['stockTotal'] = 'Le stock initial doit être strictement supérieur à zéro.';
            }
        }

        $maxConsecutiveDays = array_key_exists('maxConsecutiveDays', $payload)
            ? $this->parseMaxConsecutiveDays($payload['maxConsecutiveDays'], $errors)
            : Materiel::DEFAULT_MAX_CONSECUTIVE_DAYS;

        if ($image !== null && (!$image instanceof UploadedFile || !$this->isValidImage($image, $errors))) {
            // Error populated in $errors
        }

        if ($errors !== []) {
            return $this->json(['message' => 'Données invalides.', 'errors' => $errors], Response::HTTP_BAD_REQUEST);
        }

        $materiel = new Materiel();
        $materiel->setDesignation($designation);
        $materiel->setCategorie($categorie);
        $materiel->setReferenceInterne(isset($payload['referenceInterne']) && is_string($payload['referenceInterne']) && trim($payload['referenceInterne']) !== '' ? trim($payload['referenceInterne']) : null);
        $materiel->setDescription(isset($payload['description']) && is_string($payload['description']) ? trim($payload['description']) : null);
        $materiel->setConsignesUtilisation(isset($payload['consignesUtilisation']) && is_string($payload['consignesUtilisation']) ? trim($payload['consignesUtilisation']) : null);
        $materiel->setStockTotal((int) $rawStock);
        $materiel->setMaxConsecutiveDays((int) $maxConsecutiveDays);
        $materiel->setIsArchived(false);
        $materiel->setCreatedAt(new \DateTimeImmutable());

        $imagePath = $image instanceof UploadedFile ? $this->imageStorage->store($image, self::IMAGE_FOLDER) : null;
        $materiel->setImagePath($imagePath);

        $this->entityManager->persist($materiel);
        try {
            $this->entityManager->flush();
        } catch (\Throwable $e) {
            if ($imagePath !== null) {
                $this->imageStorage->delete($imagePath, self::IMAGE_FOLDER);
            }
            throw $e;
        }

        return $this->json(self::serializeEquipment($materiel), Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'admin_equipment_update', methods: ['PUT', 'PATCH', 'POST'], requirements: ['id' => '\d+'])]
    public function update(Materiel $materiel, Request $request, #[CurrentUser] User $agent): JsonResponse
    {
        $payload = $this->requestPayload($request);
        $image = $request->files->get('photo') ?? $request->files->get('image');
        $force = filter_var($payload['force'] ?? false, FILTER_VALIDATE_BOOLEAN);

        $errors = [];

        if (array_key_exists('designation', $payload)) {
            $designation = trim((string) $payload['designation']);
            if ($designation === '') {
                $errors['designation'] = 'La désignation du matériel ne peut pas être vide.';
            } else {
                $materiel->setDesignation($designation);
            }
        }

        if (array_key_exists('categorie', $payload)) {
            $categorie = trim((string) $payload['categorie']);
            if ($categorie === '') {
                $errors['categorie'] = 'La catégorie ne peut pas être vide.';
            } else {
                $materiel->setCategorie($categorie);
            }
        }

        if (array_key_exists('referenceInterne', $payload)) {
            $ref = is_string($payload['referenceInterne']) ? trim($payload['referenceInterne']) : null;
            $materiel->setReferenceInterne($ref !== '' ? $ref : null);
        }

        if (array_key_exists('description', $payload)) {
            $materiel->setDescription(is_string($payload['description']) ? trim($payload['description']) : null);
        }

        if (array_key_exists('consignesUtilisation', $payload)) {
            $materiel->setConsignesUtilisation(is_string($payload['consignesUtilisation']) ? trim($payload['consignesUtilisation']) : null);
        }

        if (array_key_exists('maxConsecutiveDays', $payload)) {
            $maxConsecutiveDays = $this->parseMaxConsecutiveDays($payload['maxConsecutiveDays'], $errors);
            if ($maxConsecutiveDays !== null) {
                $materiel->setMaxConsecutiveDays($maxConsecutiveDays);
            }
        }

        if ($image !== null && (!$image instanceof UploadedFile || !$this->isValidImage($image, $errors))) {
            // Error populated in $errors
        }

        $stockToUpdate = null;
        $reason = null;
        if (array_key_exists('stockTotal', $payload) || array_key_exists('quantiteTotale', $payload)) {
            $rawStock = $payload['stockTotal'] ?? $payload['quantiteTotale'];
            if ($rawStock === null || (!is_int($rawStock) && !ctype_digit((string) $rawStock))) {
                $errors['stockTotal'] = 'Le stock doit être un entier positif ou nul.';
            } else {
                $stock = (int) $rawStock;
                if ($stock < 0) {
                    $errors['stockTotal'] = 'Le stock doit être un entier positif ou nul.';
                } else {
                    $stockToUpdate = $stock;
                }
            }

            $rawReason = $payload['reason'] ?? null;
            if (!is_string($rawReason) || !in_array($rawReason, StockAdjustment::REASONS, true)) {
                $errors['reason'] = 'Le motif de l’ajustement est obligatoire et invalide.';
            } else {
                $reason = $rawReason;
            }
        }

        if ($errors !== []) {
            return $this->json(['message' => 'Données invalides.', 'errors' => $errors], Response::HTTP_BAD_REQUEST);
        }

        if ($image instanceof UploadedFile) {
            $oldImage = $materiel->getImagePath();
            $newImage = $this->imageStorage->store($image, self::IMAGE_FOLDER);
            $materiel->setImagePath($newImage);
            if ($oldImage !== null) {
                $this->imageStorage->delete($oldImage, self::IMAGE_FOLDER);
            }
        }

        if ($stockToUpdate !== null) {
            try {
                $this->stockService->adjustStock($materiel, $stockToUpdate, $reason, $agent, $force);
            } catch (StockConflictException $conflictException) {
                return $this->json([
                    'message' => $conflictException->getMessage(),
                    'hasConflict' => true,
                    'maxBooked' => $conflictException->getMaxBooked(),
                    'conflictingReservations' => $conflictException->getConflicts(),
                ], Response::HTTP_CONFLICT);
            }

        } else {
            $this->entityManager->flush();
        }

        return $this->json(self::serializeEquipment($materiel));
    }

    #[Route('/{id}/stock-adjustments', name: 'admin_equipment_stock_adjustments', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function stockAdjustments(Materiel $materiel): JsonResponse
    {
        $adjustments = $this->stockAdjustmentRepository->findForEquipment($materiel->getId() ?? 0);

        return $this->json(array_map(
            static fn (StockAdjustment $adjustment): array => [
                'id' => $adjustment->getId(),
                'previousStock' => $adjustment->getPreviousStock(),
                'newStock' => $adjustment->getNewStock(),
                'reason' => $adjustment->getReason(),
                'createdAt' => $adjustment->getCreatedAt()->format(\DateTimeInterface::ATOM),
                'agent' => [
                    'id' => $adjustment->getAgent()?->getId(),
                    'nom' => $adjustment->getAgent()?->getNom(),
                    'prenom' => $adjustment->getAgent()?->getPrenom(),
                ],
            ],
            $adjustments,
        ));
    }

    #[Route('/{id}/check-stock', name: 'admin_equipment_check_stock', methods: ['POST', 'GET'], requirements: ['id' => '\d+'])]
    public function checkStock(Materiel $materiel, Request $request): JsonResponse
    {
        $payload = $this->requestPayload($request);
        $rawStock = $payload['stockTotal'] ?? $payload['quantiteTotale'] ?? $request->query->get('quantity');

        if ($rawStock === null || (!is_int($rawStock) && !ctype_digit((string) $rawStock))) {
            return $this->json(['message' => 'Le stock doit être un entier positif ou nul.'], Response::HTTP_BAD_REQUEST);
        }

        $stock = (int) $rawStock;
        if ($stock < 0) {
            return $this->json(['message' => 'Le stock doit être un entier positif ou nul.'], Response::HTTP_BAD_REQUEST);
        }

        $analysis = $this->stockService->checkStockReductionConflict($materiel, $stock);

        return $this->json([
            'equipmentId' => $materiel->getId(),
            'currentStock' => $materiel->getStockTotal(),
            'requestedStock' => $stock,
            'hasConflict' => $analysis['hasConflict'],
            'maxBooked' => $analysis['maxBooked'],
            'conflictingReservations' => $analysis['conflictingReservations'],
        ]);
    }

    #[Route('/{id}', name: 'admin_equipment_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(Materiel $materiel): JsonResponse
    {
        $this->stockService->archive($materiel);

        return $this->json([
            'message' => 'Équipement archivé avec succès.',
            'equipment' => self::serializeEquipment($materiel),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    /**
     * @param array<string, string> $errors
     */
    private function parseMaxConsecutiveDays(mixed $value, array &$errors): ?int
    {
        $days = filter_var($value, FILTER_VALIDATE_INT, [
            'options' => ['min_range' => 1, 'max_range' => Materiel::MAX_CONSECUTIVE_DAYS_LIMIT],
        ]);
        if ($days === false) {
            $errors['maxConsecutiveDays'] = \sprintf(
                'La durée maximale doit être comprise entre 1 et %d jours.',
                Materiel::MAX_CONSECUTIVE_DAYS_LIMIT,
            );

            return null;
        }

        return $days;
    }

    private function requestPayload(Request $request): array
    {
        if ($request->request->count() > 0) {
            return $request->request->all();
        }

        $content = $request->getContent();
        if ($content === '') {
            return [];
        }

        $payload = json_decode($content, true);

        return is_array($payload) ? $payload : [];
    }

    /**
     * @param array<string, string> $errors
     */
    /**
     * @param array<string, string> $errors
     */
    private function isValidImage(UploadedFile $image, array &$errors): bool
    {
        try {
            $this->imageStorage->validate($image);
        } catch (\InvalidArgumentException $exception) {
            // Le formulaire envoie le fichier sous « photo », l’API historique sous « image ».
            $errors['image'] = $exception->getMessage();
            $errors['photo'] = $exception->getMessage();

            return false;
        }

        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public static function serializeEquipment(Materiel $materiel): array
    {
        return [
            'id' => $materiel->getId(),
            'designation' => $materiel->getDesignation(),
            'categorie' => $materiel->getCategorie(),
            'referenceInterne' => $materiel->getReferenceInterne(),
            'description' => $materiel->getDescription(),
            'consignesUtilisation' => $materiel->getConsignesUtilisation(),
            'stockTotal' => $materiel->getStockTotal(),
            'maxConsecutiveDays' => $materiel->getMaxConsecutiveDays(),
            'isArchived' => $materiel->isArchived(),
            'statut' => $materiel->isArchived() ? 'Archivé' : 'Disponible',
            'imagePath' => $materiel->getImagePath(),
            'createdAt' => $materiel->getCreatedAt()?->format(\DateTimeInterface::ATOM),
        ];
    }
}
