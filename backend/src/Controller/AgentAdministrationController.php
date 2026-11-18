<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Security\SecurityAuditLogger;
use App\Service\AgentInvitationMailer;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/admin/agents')]
#[IsGranted('ROLE_ADMIN')]
final class AgentAdministrationController extends AbstractController
{
    private const STATUSES = ['ACTIVE', 'INACTIVE'];
    private const ADMIN_ROLE = 'ROLE_ADMIN';

    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly EntityManagerInterface $entityManager,
        private readonly SecurityAuditLogger $audit,
        private readonly AgentInvitationMailer $invitationMailer,
    ) {
    }

    #[Route('', name: 'admin_agents_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $page = max(1, $request->query->getInt('page', 1));
        $itemsPerPage = min(50, max(1, $request->query->getInt('itemsPerPage', 10)));
        $status = $request->query->get('status');
        $search = $request->query->get('q');

        if ($status !== null && !in_array($status, self::STATUSES, true)) {
            return $this->json(['message' => 'Le statut demandé est invalide.'], Response::HTTP_BAD_REQUEST);
        }

        return $this->json([
            'items' => array_map(
                static fn (User $agent): array => self::serializeAgent($agent),
                $this->userRepository->findAgents($status, $page, $itemsPerPage, $search),
            ),
            'page' => $page,
            'itemsPerPage' => $itemsPerPage,
            'totalItems' => $this->userRepository->countAgents($status, $search),
        ]);
    }

    #[Route('/{id<\d+>}', name: 'admin_agent_show', methods: ['GET'])]
    public function show(int $id): JsonResponse
    {
        $agent = $this->userRepository->findAgent($id);
        if (!$agent instanceof User) {
            return $this->json(['message' => 'Agent introuvable.'], Response::HTTP_NOT_FOUND);
        }

        return $this->json(self::serializeAgent($agent));
    }

    #[Route('', name: 'admin_agent_create', methods: ['POST'])]
    public function create(Request $request, ValidatorInterface $validator): JsonResponse
    {
        $payload = $this->decodePayload($request);
        if ($payload instanceof JsonResponse) {
            return $payload;
        }

        $errors = $this->validateAgentPayload($payload, false, false);
        if ($errors !== []) {
            return $this->json(['message' => 'Les données envoyées sont invalides.', 'errors' => $errors], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $email = mb_strtolower(trim($payload['email']));
        if ($this->userRepository->findOneBy(['email' => $email]) !== null) {
            return $this->json(['message' => 'Cette adresse email est déjà utilisée.'], Response::HTTP_CONFLICT);
        }

        $agent = (new User())
            ->setEmail($email)
            ->setNom(trim($payload['nom']))
            ->setPrenom(trim($payload['prenom']))
            ->setTelephone($this->nullableString($payload['telephone'] ?? null))
            ->setTypeCompte('mairie')
            ->setRoles(self::normalizeRoles($payload['roles']));

        $validationErrors = $this->validateEntity($validator, $agent);
        if ($validationErrors !== []) {
            return $this->json(['message' => 'Les données envoyées sont invalides.', 'errors' => $validationErrors], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $this->entityManager->persist($agent);
        $this->entityManager->flush();
        $this->audit->rolesChanged($agent, $this->currentAgent(), [], $agent->getRoles());

        return $this->json(
            [...self::serializeAgent($agent), 'invitationSent' => $this->invitationMailer->send($agent)],
            Response::HTTP_CREATED,
        );
    }

    /**
     * Renvoie le lien d'activation d'un agent qui n'a pas encore choisi son mot de passe.
     */
    #[Route('/{id<\d+>}/invitation', name: 'admin_agent_invitation', methods: ['POST'])]
    public function resendInvitation(int $id): JsonResponse
    {
        $agent = $this->userRepository->findAgent($id);
        if (!$agent instanceof User) {
            return $this->json(['message' => 'Agent introuvable.'], Response::HTTP_NOT_FOUND);
        }
        if ($agent->isVerified()) {
            return $this->json(['message' => 'Ce compte est déjà activé.'], Response::HTTP_CONFLICT);
        }
        if ($agent->isInactive()) {
            return $this->json(['message' => 'Réactivez ce compte avant de renvoyer une invitation.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }
        if (!$this->invitationMailer->send($agent)) {
            return $this->json(['message' => 'L’e-mail d’invitation n’a pas pu être envoyé.'], Response::HTTP_BAD_GATEWAY);
        }

        return $this->json(['message' => 'L’invitation a été renvoyée.']);
    }

    #[Route('/{id<\d+>}', name: 'admin_agent_update', methods: ['PATCH'])]
    public function update(int $id, Request $request, ValidatorInterface $validator): JsonResponse
    {
        $agent = $this->userRepository->findAgent($id);
        if (!$agent instanceof User) {
            return $this->json(['message' => 'Agent introuvable.'], Response::HTTP_NOT_FOUND);
        }
        $rolesBefore = $agent->getRoles();

        $payload = $this->decodePayload($request);
        if ($payload instanceof JsonResponse) {
            return $payload;
        }

        $errors = $this->validateAgentPayload($payload, true, in_array(self::ADMIN_ROLE, $rolesBefore, true));
        if ($errors !== []) {
            return $this->json(['message' => 'Les données envoyées sont invalides.', 'errors' => $errors], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if (array_key_exists('email', $payload)) {
            $email = mb_strtolower(trim($payload['email']));
            $existing = $this->userRepository->findOneBy(['email' => $email]);
            if ($existing !== null && $existing->getId() !== $agent->getId()) {
                return $this->json(['message' => 'Cette adresse email est déjà utilisée.'], Response::HTTP_CONFLICT);
            }
            $agent->setEmail($email);
        }
        if (array_key_exists('nom', $payload)) {
            $agent->setNom(trim($payload['nom']));
        }
        if (array_key_exists('prenom', $payload)) {
            $agent->setPrenom(trim($payload['prenom']));
        }
        if (array_key_exists('telephone', $payload)) {
            $agent->setTelephone($this->nullableString($payload['telephone']));
        }
        if (array_key_exists('roles', $payload)) {
            $losesAdministrator = in_array(self::ADMIN_ROLE, $agent->getRoles(), true)
                && !in_array(self::ADMIN_ROLE, $payload['roles'], true);
            if ($losesAdministrator && $this->isCurrentAgent($agent)) {
                return $this->json(['message' => 'Vous ne pouvez pas retirer vos propres droits d’administrateur.'], Response::HTTP_UNPROCESSABLE_ENTITY);
            }
            if ($losesAdministrator && $this->userRepository->countAdministrators() <= 1) {
                return $this->json(['message' => 'Le dernier administrateur ne peut pas être rétrogradé.'], Response::HTTP_UNPROCESSABLE_ENTITY);
            }
            $agent->setRoles(self::normalizeRoles($payload['roles']));
        }

        $validationErrors = $this->validateEntity($validator, $agent);
        if ($validationErrors !== []) {
            return $this->json(['message' => 'Les données envoyées sont invalides.', 'errors' => $validationErrors], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $this->entityManager->flush();
        if ($rolesBefore !== $agent->getRoles()) {
            $this->audit->rolesChanged($agent, $this->currentAgent(), $rolesBefore, $agent->getRoles());
        }

        return $this->json(self::serializeAgent($agent));
    }

    #[Route('/{id<\d+>}/status', name: 'admin_agent_status', methods: ['PATCH'])]
    public function updateStatus(int $id, Request $request): JsonResponse
    {
        $agent = $this->userRepository->findAgent($id);
        if (!$agent instanceof User) {
            return $this->json(['message' => 'Agent introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $payload = $this->decodePayload($request);
        if ($payload instanceof JsonResponse) {
            return $payload;
        }

        $status = $payload['status'] ?? null;
        if (!is_string($status) || !in_array($status, self::STATUSES, true)) {
            return $this->json(['message' => 'Le statut demandé est invalide.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if ($status === 'INACTIVE' && $this->isCurrentAgent($agent)) {
            return $this->json(['message' => 'Vous ne pouvez pas désactiver votre propre compte.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $agent->setInactivatedAt($status === 'INACTIVE' ? new \DateTimeImmutable() : null);
        $this->entityManager->flush();

        return $this->json(self::serializeAgent($agent));
    }

    #[Route('/{id<\d+>}', name: 'admin_agent_delete', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        $agent = $this->userRepository->findAgent($id);
        if (!$agent instanceof User) {
            return $this->json(['message' => 'Agent introuvable.'], Response::HTTP_NOT_FOUND);
        }

        if ($this->isCurrentAgent($agent)) {
            return $this->json(['message' => 'Vous ne pouvez pas supprimer votre propre compte.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if (in_array('ROLE_ADMIN', $agent->getRoles(), true) && $this->userRepository->countAdministrators() <= 1) {
            return $this->json(['message' => 'Le dernier administrateur ne peut pas être supprimé.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $agent
            ->setDeletedAt(new \DateTimeImmutable())
            ->setInactivatedAt(new \DateTimeImmutable());
        $this->entityManager->flush();

        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
    }

    /** @return array<string, mixed> */
    private static function serializeAgent(User $agent): array
    {
        return [
            'id' => $agent->getId(),
            'email' => $agent->getEmail(),
            'nom' => $agent->getNom(),
            'prenom' => $agent->getPrenom(),
            'telephone' => $agent->getTelephone(),
            'roles' => array_values(array_intersect($agent->getRoles(), User::ROLES_MAIRIE)),
            'isVerified' => $agent->isVerified(),
            'status' => $agent->isInactive() ? 'INACTIVE' : 'ACTIVE',
            'createdAt' => $agent->getCreatedAt()?->format(\DateTimeInterface::ATOM),
        ];
    }

    /** @return array<string, mixed>|JsonResponse */
    private function decodePayload(Request $request): array|JsonResponse
    {
        $payload = json_decode($request->getContent(), true);
        if (!is_array($payload) || json_last_error() !== JSON_ERROR_NONE) {
            return $this->json(['message' => 'Le corps de la requête est invalide.'], Response::HTTP_BAD_REQUEST);
        }

        return $payload;
    }

    /**
     * L'application ne compte qu'un administrateur : ce droit ne s'attribue jamais depuis la gestion des agents.
     *
     * @param array<string, mixed> $payload
     */
    private function validateAgentPayload(array $payload, bool $partial, bool $isAdministrator): array
    {
        $errors = [];
        foreach (['nom', 'prenom', 'email'] as $field) {
            if (!$partial || array_key_exists($field, $payload)) {
                if (!is_string($payload[$field] ?? null) || trim($payload[$field]) === '') {
                    $errors[$field] = 'Ce champ est obligatoire.';
                }
            }
        }

        if (array_key_exists('email', $payload) && (!is_string($payload['email']) || mb_strlen(trim($payload['email'])) > 180 || !filter_var(trim($payload['email']), FILTER_VALIDATE_EMAIL))) {
            $errors['email'] = 'Le format email est invalide.';
        }
        foreach (['nom', 'prenom'] as $field) {
            if (array_key_exists($field, $payload) && is_string($payload[$field]) && mb_strlen(trim($payload[$field])) > 100) {
                $errors[$field] = 'Ce champ ne peut pas dépasser 100 caractères.';
            }
        }
        if (array_key_exists('telephone', $payload) && $payload['telephone'] !== null && !is_string($payload['telephone'])) {
            $errors['telephone'] = 'Le téléphone est invalide.';
        }
        if (!$partial || array_key_exists('roles', $payload)) {
            $roles = $payload['roles'] ?? null;
            if (!is_array($roles) || !array_is_list($roles) || array_filter($roles, 'is_string') !== $roles || array_diff($roles, User::ROLES_MAIRIE) !== []) {
                $errors['roles'] = 'Un ou plusieurs rôles sont invalides.';
            } elseif (array_diff($roles, ['ROLE_MAIRIE']) === []) {
                $errors['roles'] = 'Sélectionnez au moins un module.';
            } elseif (in_array(self::ADMIN_ROLE, $roles, true) && !$isAdministrator) {
                $errors['roles'] = 'L’application ne compte qu’un seul administrateur.';
            }
        }

        return $errors;
    }

    /** @return array<string, string> */
    private function validateEntity(ValidatorInterface $validator, User $agent): array
    {
        $errors = [];
        foreach ($validator->validate($agent) as $error) {
            $errors[$error->getPropertyPath()] = $error->getMessage();
        }

        return $errors;
    }

    private function nullableString(mixed $value): ?string
    {
        return $value === null || trim((string) $value) === '' ? null : trim((string) $value);
    }

    /**
     * Un administrateur a déjà tous les modules : aucun droit partiel ne reste sur son compte.
     *
     * @param list<string> $roles
     *
     * @return list<string>
     */
    private static function normalizeRoles(array $roles): array
    {
        return in_array(self::ADMIN_ROLE, $roles, true) ? [self::ADMIN_ROLE] : array_values(array_unique($roles));
    }

    private function currentAgent(): ?User
    {
        $user = $this->getUser();

        return $user instanceof User ? $user : null;
    }

    private function isCurrentAgent(User $agent): bool
    {
        return $this->getUser()?->getUserIdentifier() === $agent->getUserIdentifier();
    }
}
