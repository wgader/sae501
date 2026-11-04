<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/admin/agents')]
#[IsGranted('ROLE_ADMIN')]
final class AgentAdministrationController extends AbstractController
{
    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly EntityManagerInterface $entityManager,
        private readonly UserPasswordHasherInterface $passwordHasher,
    ) {
    }

    #[Route('', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $agents = $this->userRepository->findBy(['typeCompte' => 'mairie'], ['nom' => 'ASC', 'prenom' => 'ASC']);

        return $this->json(array_map(static fn (User $agent): array => self::serializeAgent($agent), $agents));
    }

    #[Route('', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $payload = json_decode($request->getContent(), true);
        if (!is_array($payload)) {
            return $this->json(['message' => 'Le corps de la requête est invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $email = trim((string) ($payload['email'] ?? ''));
        $nom = trim((string) ($payload['nom'] ?? ''));
        $prenom = trim((string) ($payload['prenom'] ?? ''));
        $password = (string) ($payload['password'] ?? '');
        $roles = is_array($payload['roles'] ?? null) ? array_values($payload['roles']) : ['ROLE_GESTION_EVENT'];

        if ($email === '' || $nom === '' || $prenom === '' || $password === '') {
            return $this->json(['message' => 'Les champs email, nom, prénom et mot de passe sont obligatoires.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }
        if ($this->userRepository->findOneBy(['email' => $email]) !== null) {
            return $this->json(['message' => 'Cette adresse email est déjà utilisée.'], Response::HTTP_CONFLICT);
        }
        if (array_diff($roles, User::ROLES_MAIRIE) !== []) {
            return $this->json(['message' => 'Un ou plusieurs rôles sont invalides.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $agent = (new User())
            ->setEmail($email)
            ->setNom($nom)
            ->setPrenom($prenom)
            ->setTypeCompte('mairie')
            ->setRoles($roles)
            ->setIsVerified(true);
        $agent->setPassword($this->passwordHasher->hashPassword($agent, $password));
        $this->entityManager->persist($agent);
        $this->entityManager->flush();

        return $this->json(self::serializeAgent($agent), Response::HTTP_CREATED);
    }

    #[Route('/{id<\d+>}', methods: ['PATCH'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $agent = $this->userRepository->find($id);
        if (!$agent instanceof User || $agent->getTypeCompte() !== 'mairie') {
            return $this->json(['message' => 'Agent introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $payload = json_decode($request->getContent(), true);
        if (!is_array($payload)) {
            return $this->json(['message' => 'Le corps de la requête est invalide.'], Response::HTTP_BAD_REQUEST);
        }
        if (isset($payload['email'])) $agent->setEmail(trim((string) $payload['email']));
        if (isset($payload['nom'])) $agent->setNom(trim((string) $payload['nom']));
        if (isset($payload['prenom'])) $agent->setPrenom(trim((string) $payload['prenom']));
        if (isset($payload['roles']) && is_array($payload['roles'])) {
            if (array_diff($payload['roles'], User::ROLES_MAIRIE) !== []) {
                return $this->json(['message' => 'Un ou plusieurs rôles sont invalides.'], Response::HTTP_UNPROCESSABLE_ENTITY);
            }
            $agent->setRoles(array_values($payload['roles']));
        }
        if (isset($payload['password']) && is_string($payload['password']) && $payload['password'] !== '') {
            $agent->setPassword($this->passwordHasher->hashPassword($agent, $payload['password']));
        }
        $this->entityManager->flush();

        return $this->json(self::serializeAgent($agent));
    }

    #[Route('/{id<\d+>}', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        $agent = $this->userRepository->find($id);
        if (!$agent instanceof User || $agent->getTypeCompte() !== 'mairie') {
            return $this->json(['message' => 'Agent introuvable.'], Response::HTTP_NOT_FOUND);
        }
        $this->entityManager->remove($agent);
        $this->entityManager->flush();

        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
    }

    /** @return array<string, mixed> */
    private static function serializeAgent(User $agent): array
    {
        return [
            'id' => $agent->getId(),
            'nom' => $agent->getNom(),
            'prenom' => $agent->getPrenom(),
            'email' => $agent->getEmail(),
            'roles' => array_values(array_filter($agent->getRoles(), static fn (string $role): bool => $role !== 'ROLE_USER')),
        ];
    }
}
