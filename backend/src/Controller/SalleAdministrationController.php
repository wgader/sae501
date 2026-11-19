<?php

namespace App\Controller;

use App\Entity\Salle;
use App\Service\ImageStorage;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/admin/salles')]
#[IsGranted(new \Symfony\Component\ExpressionLanguage\Expression("is_granted('ROLE_ADMIN') or (is_granted('ROLE_MAIRIE') and is_granted('ROLE_GESTION_SALLE'))"))]
final class SalleAdministrationController extends AbstractController
{
    private const IMAGE_FOLDER = 'salles';

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly ImageStorage $imageStorage,
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

        if ($image !== null && (!$image instanceof UploadedFile || !$this->isValidImage($image, $errors))) {
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

        $imagePath = $image instanceof UploadedFile ? $this->imageStorage->store($image, self::IMAGE_FOLDER) : null;
        $salle->setImagePath($imagePath);
        $this->entityManager->persist($salle);
        try {
            $this->entityManager->flush();
        } catch (\Throwable $exception) {
            if ($imagePath !== null) {
                $this->imageStorage->delete($imagePath, self::IMAGE_FOLDER);
            }
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

        if ($image !== null && (!$image instanceof UploadedFile || !$this->isValidImage($image, $errors))) {
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
            $newImagePath = $this->imageStorage->store($image, self::IMAGE_FOLDER);
            $salle->setImagePath($newImagePath);
        }
        $salle->setUpdatedAt(new \DateTimeImmutable());
        try {
            $this->entityManager->flush();
        } catch (\Throwable $exception) {
            if ($newImagePath !== null) {
                $this->imageStorage->delete($newImagePath, self::IMAGE_FOLDER);
            }
            throw $exception;
        }
        if ($newImagePath !== null && $oldImagePath !== null) {
            $this->imageStorage->delete($oldImagePath, self::IMAGE_FOLDER);
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

        $pattern = "/^(?:[\\p{L}\\d][^,]{2,},\\s*\\d{5}(?:\\s+[\\p{L}][\\p{L} .'-]*)?|[\\p{L}\\d][^,]{2,},\\s*[\\p{L}][\\p{L} .'-]*\\s+\\d{5})$/u";

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
    /**
     * @param array<string, string> $errors
     */
    private function isValidImage(UploadedFile $image, array &$errors): bool
    {
        try {
            $this->imageStorage->validate($image);
        } catch (\InvalidArgumentException $exception) {
            $errors['image'] = $exception->getMessage();

            return false;
        }

        return true;
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
