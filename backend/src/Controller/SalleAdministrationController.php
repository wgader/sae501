<?php

namespace App\Controller;

use App\Entity\Salle;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/admin/salles')]
#[IsGranted('ROLE_ADMIN')]
final class SalleAdministrationController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    #[Route('', name: 'admin_salle_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $salles = $this->entityManager->getRepository(Salle::class)->findBy(
            ['deletedAt' => null],
            ['id' => 'DESC'],
        );

        return $this->json(array_map(
            static fn (Salle $salle): array => self::serializeSalle($salle),
            $salles,
        ));
    }

    #[Route('', name: 'admin_salle_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $payload = json_decode($request->getContent(), true);

        if (!is_array($payload)) {
            return $this->json(
                ['message' => 'Le corps de la requête est invalide.'],
                Response::HTTP_BAD_REQUEST,
            );
        }

        $errors = [];

        if (!is_string($payload['nom'] ?? null) || trim($payload['nom']) === '') {
            $errors['nom'] = 'Le nom de la salle est obligatoire.';
        }

        if (!is_string($payload['adresse'] ?? null) || trim($payload['adresse']) === '') {
            $errors['adresse'] = "L'adresse est obligatoire.";
        }

        if (
            !is_int($payload['capaciteMax'] ?? null)
            || $payload['capaciteMax'] <= 0
        ) {
            $errors['capaciteMax'] = 'La capacité maximale doit être un entier strictement supérieur à zéro.';
        }

        if (isset($payload['accesPmr']) && !is_bool($payload['accesPmr'])) {
            $errors['accesPmr'] = 'Le champ accesPmr doit être un booléen.';
        }

        if (isset($payload['equipementsInclus']) && !is_array($payload['equipementsInclus'])) {
            $errors['equipementsInclus'] = 'Le champ equipementsInclus doit être un tableau.';
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
        $salle->setAdresse(trim($payload['adresse']));
        $salle->setDescription($this->optionalString($payload['description'] ?? null));
        $salle->setCapaciteMax($payload['capaciteMax']);
        $salle->setAccesPmr($payload['accesPmr'] ?? false);
        $salle->setEquipementsInclus($payload['equipementsInclus'] ?? []);
        $salle->setCreatedAt($now);
        $salle->setUpdatedAt($now);
        $salle->setIsActive(true);
        $salle->setDeletedAt(null);

        $this->entityManager->persist($salle);
        $this->entityManager->flush();

        return $this->json(self::serializeSalle($salle), Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'admin_salle_update', methods: ['PATCH'])]
    public function update(Salle $salle, Request $request): JsonResponse
    {
        $payload = json_decode($request->getContent(), true);

        if (!is_array($payload)) {
            return $this->json(
                ['message' => 'Le corps de la requête est invalide.'],
                Response::HTTP_BAD_REQUEST,
            );
        }

        $errors = [];

        if (array_key_exists('nom', $payload)
            && (!is_string($payload['nom']) || trim($payload['nom']) === '')
        ) {
            $errors['nom'] = 'Le nom de la salle est obligatoire.';
        }

        if (array_key_exists('adresse', $payload)
            && (!is_string($payload['adresse']) || trim($payload['adresse']) === '')
        ) {
            $errors['adresse'] = "L'adresse est obligatoire.";
        }

        if (array_key_exists('capaciteMax', $payload)
            && (!is_int($payload['capaciteMax']) || $payload['capaciteMax'] <= 0)
        ) {
            $errors['capaciteMax'] = 'La capacité maximale doit être un entier strictement supérieur à zéro.';
        }

        if (array_key_exists('description', $payload)
            && $payload['description'] !== null
            && !is_string($payload['description'])
        ) {
            $errors['description'] = 'La description doit être une chaîne de caractères ou null.';
        }

        if (array_key_exists('accesPmr', $payload) && !is_bool($payload['accesPmr'])) {
            $errors['accesPmr'] = 'Le champ accesPmr doit être un booléen.';
        }

        if (array_key_exists('equipementsInclus', $payload)
            && !is_array($payload['equipementsInclus'])
        ) {
            $errors['equipementsInclus'] = 'Le champ equipementsInclus doit être un tableau.';
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
            $salle->setAdresse(trim($payload['adresse']));
        }
        if (array_key_exists('description', $payload)) {
            $salle->setDescription($payload['description']);
        }
        if (array_key_exists('capaciteMax', $payload)) {
            $salle->setCapaciteMax($payload['capaciteMax']);
        }
        if (array_key_exists('accesPmr', $payload)) {
            $salle->setAccesPmr($payload['accesPmr']);
        }
        if (array_key_exists('equipementsInclus', $payload)) {
            $salle->setEquipementsInclus($payload['equipementsInclus']);
        }

        $salle->setUpdatedAt(new \DateTimeImmutable());
        $this->entityManager->flush();

        return $this->json(self::serializeSalle($salle));
    }

    private function optionalString(mixed $value): ?string
    {
        return is_string($value) ? $value : null;
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
