<?php

namespace App\Controller;

use App\Entity\Salle;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/admin/salles')]
#[IsGranted('ROLE_ADMIN')]
final class SalleAdministrationController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        #[Autowire('%kernel.project_dir%')]
        private readonly string $projectDir,
    ) {
    }

    #[Route('', name: 'admin_salle_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $salles = $this->entityManager->getRepository(Salle::class)->findBy([], ['id' => 'DESC']);

        return $this->json(array_map(
            static fn (Salle $salle): array => self::serializeSalle($salle),
            $salles,
        ));
    }

    #[Route('', name: 'admin_salle_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $payload = $this->requestPayload($request);
        $image = $request->files->get('image');

        $errors = [];

        if (!is_string($payload['nom'] ?? null) || trim($payload['nom']) === '') {
            $errors['nom'] = 'Le nom de la salle est obligatoire.';
        }

        $address = $this->normalizeAddress($payload['adresse'] ?? null);
        if ($address === null) {
            $errors['adresse'] = "L'adresse doit contenir une voie, un code postal à 5 chiffres et une ville.";
        }

        $capacity = filter_var($payload['capaciteMax'] ?? null, FILTER_VALIDATE_INT);
        if ($capacity === false || $capacity <= 0) {
            $errors['capaciteMax'] = 'La capacité maximale doit être un entier strictement supérieur à zéro.';
        }

        if (!$this->parseBoolean($payload['accesPmr'] ?? false, $accesPmr)) {
            $errors['accesPmr'] = 'Le champ accesPmr doit être un booléen.';
        }

        $equipments = $this->parseEquipments($payload['equipementsInclus'] ?? []);
        if ($equipments === null) {
            $errors['equipementsInclus'] = 'Le champ equipementsInclus doit être un tableau.';
        }

        if (!$image instanceof UploadedFile) {
            $errors['image'] = 'Une image est obligatoire.';
        } elseif (!$this->validateImage($image, $errors)) {
        }

        if ($errors !== []) {
            return $this->json(
                ['errors' => $errors],
                Response::HTTP_UNPROCESSABLE_ENTITY,
            );
        }

        $now = new \DateTimeImmutable();
        $salle = new Salle();
        $salle->setNom(trim($payload['nom']));
        $salle->setAdresse($address);
        $salle->setDescription($this->optionalString($payload['description'] ?? null));
        $salle->setCapaciteMax($capacity);
        $salle->setAccesPmr($accesPmr);
        $salle->setEquipementsInclus($equipments);
        $salle->setCreatedAt($now);
        $salle->setUpdatedAt($now);
        $salle->setIsActive(true);
        $salle->setDeletedAt(null);

        $imagePath = $this->storeImage($image);
        $salle->setImagePath($imagePath);
        $this->entityManager->persist($salle);
        try {
            $this->entityManager->flush();
        } catch (\Throwable $exception) {
            $this->deleteStoredImage($imagePath);
            throw $exception;
        }

        return $this->json(self::serializeSalle($salle), Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'admin_salle_update', methods: ['PATCH'])]
    #[Route('/{id}', name: 'admin_salle_update_multipart', methods: ['POST'])]
    public function update(Salle $salle, Request $request): JsonResponse
    {
        $payload = $this->requestPayload($request);
        $image = $request->files->get('image');

        $errors = [];

        if (array_key_exists('nom', $payload)
            && (!is_string($payload['nom']) || trim($payload['nom']) === '')
        ) {
            $errors['nom'] = 'Le nom de la salle est obligatoire.';
        }

        $address = null;
        if (array_key_exists('adresse', $payload)) {
            $address = $this->normalizeAddress($payload['adresse']);
            if ($address === null) {
                $errors['adresse'] = "L'adresse doit contenir une voie, un code postal à 5 chiffres et une ville.";
            }
        }

        $capacity = filter_var($payload['capaciteMax'] ?? null, FILTER_VALIDATE_INT);
        if (array_key_exists('capaciteMax', $payload) && ($capacity === false || $capacity <= 0)) {
            $errors['capaciteMax'] = 'La capacité maximale doit être un entier strictement supérieur à zéro.';
        }

        if (array_key_exists('description', $payload)
            && $payload['description'] !== null
            && !is_string($payload['description'])
        ) {
            $errors['description'] = 'La description doit être une chaîne de caractères ou null.';
        }

        $accesPmr = null;
        if (array_key_exists('accesPmr', $payload) && !$this->parseBoolean($payload['accesPmr'], $accesPmr)) {
                $errors['accesPmr'] = 'Le champ accesPmr doit être un booléen.';
        }

        $equipments = array_key_exists('equipementsInclus', $payload)
            ? $this->parseEquipments($payload['equipementsInclus'])
            : null;
        if (array_key_exists('equipementsInclus', $payload) && $equipments === null) {
            $errors['equipementsInclus'] = 'Le champ equipementsInclus doit être un tableau.';
        }

        if ($image !== null && (!$image instanceof UploadedFile || !$this->validateImage($image, $errors))) {
        }

        if ($errors !== []) {
            return $this->json(
                ['errors' => $errors],
                Response::HTTP_UNPROCESSABLE_ENTITY,
            );
        }

        if (array_key_exists('nom', $payload)) {
            $salle->setNom(trim($payload['nom']));
        }
        if (array_key_exists('adresse', $payload)) {
            $salle->setAdresse($address);
        }
        if (array_key_exists('description', $payload)) {
            $salle->setDescription($payload['description']);
        }
        if (array_key_exists('capaciteMax', $payload)) {
            $salle->setCapaciteMax($capacity);
        }
        if (array_key_exists('accesPmr', $payload)) {
            $salle->setAccesPmr($accesPmr);
        }
        if (array_key_exists('equipementsInclus', $payload)) {
            $salle->setEquipementsInclus($equipments);
        }

        $oldImagePath = $salle->getImagePath();
        $newImagePath = null;
        if ($image instanceof UploadedFile) {
            $newImagePath = $this->storeImage($image);
            $salle->setImagePath($newImagePath);
        }
        $salle->setUpdatedAt(new \DateTimeImmutable());
        try {
            $this->entityManager->flush();
        } catch (\Throwable $exception) {
            if ($newImagePath !== null) {
                $this->deleteStoredImage($newImagePath);
            }
            throw $exception;
        }
        if ($newImagePath !== null && $oldImagePath !== null) {
            $this->deleteStoredImage($oldImagePath);
        }

        return $this->json(self::serializeSalle($salle));
    }

    #[Route('/{id}/status', name: 'admin_salle_status', methods: ['PATCH'])]
    public function updateStatus(Salle $salle, Request $request): JsonResponse
    {
        $payload = json_decode($request->getContent(), true);

        if (!is_array($payload) || !is_bool($payload['isActive'] ?? null)) {
            return $this->json(
                ['errors' => ['isActive' => 'Le champ isActive doit être un booléen.']],
                Response::HTTP_UNPROCESSABLE_ENTITY,
            );
        }

        $salle->setIsActive($payload['isActive']);
        $salle->setUpdatedAt(new \DateTimeImmutable());
        $this->entityManager->flush();

        return $this->json(self::serializeSalle($salle));
    }

    #[Route('/{id}', name: 'admin_salle_archive', methods: ['DELETE'])]
    public function archive(Salle $salle): JsonResponse
    {
        if ($salle->getDeletedAt() !== null) {
            return $this->json(
                ['message' => 'Cette salle est déjà archivée.'],
                Response::HTTP_CONFLICT,
            );
        }

        $salle->setDeletedAt(new \DateTimeImmutable());
        $salle->setIsActive(false);
        $salle->setUpdatedAt(new \DateTimeImmutable());
        $this->entityManager->flush();

        return $this->json(self::serializeSalle($salle));
    }

    private function optionalString(mixed $value): ?string
    {
        return is_string($value) ? $value : null;
    }

    private function normalizeAddress(mixed $value): ?string
    {
        if (!is_string($value)) {
            return null;
        }

        $address = preg_replace('/\s+/u', ' ', trim($value));
        if ($address === null || mb_strlen($address) > 255) {
            return null;
        }

        $pattern = "/^[\\p{L}][\\p{L} .'-]*,\\s*\\d{5}\\s+[\\p{L}][\\p{L} .'-]*$/u";

        return preg_match($pattern, $address) === 1 ? $address : null;
    }

    /**
     * @return array<string, mixed>
     */
    private function requestPayload(Request $request): array
    {
        if ($request->request->count() > 0) {
            $payload = $request->request->all();
            if (isset($payload['equipementsInclus']) && is_string($payload['equipementsInclus'])) {
                $payload['equipementsInclus'] = json_decode($payload['equipementsInclus'], true);
            }

            return $payload;
        }

        $payload = json_decode($request->getContent(), true);

        return is_array($payload) ? $payload : [];
    }

    private function parseBoolean(mixed $value, ?bool &$result): bool
    {
        if (is_bool($value)) {
            $result = $value;

            return true;
        }
        if (is_string($value) && in_array(strtolower($value), ['true', 'false'], true)) {
            $result = strtolower($value) === 'true';

            return true;
        }

        return false;
    }

    /**
     * @return array<int, string>|null
     */
    private function parseEquipments(mixed $value): ?array
    {
        if (!is_array($value) || array_filter($value, static fn (mixed $item): bool => !is_string($item)) !== []) {
            return null;
        }

        return array_values($value);
    }

    /**
     * @param array<string, string> $errors
     */
    private function validateImage(UploadedFile $image, array &$errors): bool
    {
        if (!$image->isValid()) {
            $errors['image'] = 'Le transfert de l’image a échoué.';

            return false;
        }
        if ($image->getSize() === false || $image->getSize() > 5 * 1024 * 1024) {
            $errors['image'] = 'L’image ne doit pas dépasser 5 Mo.';

            return false;
        }

        $mimeType = $image->getMimeType();
        $allowedMimeTypes = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
        ];
        if (!isset($allowedMimeTypes[$mimeType])) {
            $errors['image'] = 'Le fichier doit être une image JPEG, PNG ou WebP.';

            return false;
        }
        $dimensions = @getimagesize($image->getPathname());
        if (
            $dimensions === false
            || $dimensions[0] < 1
            || $dimensions[1] < 1
            || $dimensions[0] > 8000
            || $dimensions[1] > 8000
        ) {
            $errors['image'] = 'Le contenu du fichier image est invalide.';

            return false;
        }

        return true;
    }

    private function storeImage(UploadedFile $image): string
    {
        $directory = $this->projectDir . '/public/uploads/salles';
        if (!is_dir($directory) && !mkdir($directory, 0755, true) && !is_dir($directory)) {
            throw new \RuntimeException('Le répertoire de stockage des images est indisponible.');
        }

        $mimeType = $image->getMimeType();
        $extension = match ($mimeType) {
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            default => throw new \RuntimeException('Type d’image non autorisé.'),
        };
        $filename = bin2hex(random_bytes(24)) . '.' . $extension;
        $image->move($directory, $filename);

        return '/uploads/salles/' . $filename;
    }

    private function deleteStoredImage(string $imagePath): void
    {
        $prefix = '/uploads/salles/';
        if (!str_starts_with($imagePath, $prefix)) {
            return;
        }

        $filename = basename($imagePath);
        $fullPath = $this->projectDir . '/public' . $prefix . $filename;
        if (is_file($fullPath) && !unlink($fullPath)) {
            throw new \RuntimeException('Impossible de supprimer l’ancienne image de salle.');
        }
    }

    /**
     * @return array<string, mixed>
     */
    private static function serializeSalle(Salle $salle): array
    {
        return [
            'id' => $salle->getId(),
            'nom' => $salle->getNom(),
            'description' => $salle->getDescription(),
            'imageUrl' => $salle->getImagePath(),
            'adresse' => $salle->getAdresse(),
            'capaciteMax' => $salle->getCapaciteMax(),
            'accesPmr' => $salle->isAccesPmr(),
            'equipementsInclus' => $salle->getEquipementsInclus(),
            'createdAt' => $salle->getCreatedAt()?->format(\DateTimeInterface::ATOM),
            'updatedAt' => $salle->getUpdatedAt()?->format(\DateTimeInterface::ATOM),
            'isActive' => $salle->isActive(),
            'deletedAt' => $salle->getDeletedAt()?->format(\DateTimeInterface::ATOM),
        ];
    }
}
