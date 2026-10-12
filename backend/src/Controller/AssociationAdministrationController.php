<?php

namespace App\Controller;

use App\Entity\Association;
use App\Repository\AssociationRepository;
use App\Service\AssociationStatusNotifier;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/admin/associations')]
#[IsGranted('ROLE_ADMIN')]
final class AssociationAdministrationController extends AbstractController
{
    private const STATUSES = ['PENDING_VALIDATION', 'VALIDATED', 'REFUSED'];
    private const MODULES = ['subventions', 'materiel', 'salles'];

    public function __construct(
        private readonly AssociationRepository $associationRepository,
        private readonly EntityManagerInterface $entityManager,
        private readonly AssociationStatusNotifier $statusNotifier,
    ) {
    }

    #[Route('', name: 'admin_associations_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $page = max(1, $request->query->getInt('page', 1));
        $itemsPerPage = min(50, max(1, $request->query->getInt('itemsPerPage', 10)));
        $status = $request->query->get('status');

        if ($status !== null && !in_array($status, self::STATUSES, true)) {
            return $this->json(['message' => 'Le statut demandé est invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $totalItems = $this->associationRepository->countForAdministration($status);
        $items = array_map(
            static fn (Association $association): array => self::serializeAssociation($association),
            $this->associationRepository->findForAdministration($status, $page, $itemsPerPage),
        );

        return $this->json([
            'items' => $items,
            'page' => $page,
            'itemsPerPage' => $itemsPerPage,
            'totalItems' => $totalItems,
        ]);
    }

    #[Route('/{id}/status', name: 'admin_association_status', methods: ['PATCH'])]
    public function updateStatus(Association $association, Request $request): JsonResponse
    {
        $payload = json_decode($request->getContent(), true);
        if (!is_array($payload)) {
            return $this->json(['message' => 'Le corps de la requête est invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $status = $payload['status'] ?? null;
        if (!is_string($status) || !in_array($status, self::STATUSES, true)) {
            return $this->json(['message' => 'Le statut demandé est invalide.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }
        $previousStatus = $association->getStatut();
        $normalizedPermissions = self::MODULES;

        $this->entityManager->wrapInTransaction(function () use ($association, $status, $normalizedPermissions): void {
            $association->setStatut($status);
            $association->setPermissions($normalizedPermissions);
            $this->entityManager->flush();
        });

        if ($previousStatus !== $status) {
            $this->statusNotifier->notify($association, $status);
        }

        return $this->json(self::serializeAssociation($association));
    }

    /**
     * @return array<string, mixed>
     */
    private static function serializeAssociation(Association $association): array
    {
        return [
            'id' => $association->getId(),
            'nom' => $association->getNom(),
            'numeroRna' => $association->getNumeroRna(),
            'statut' => $association->getStatut(),
            'permissions' => $association->getPermissions() ?? [],
            'createdAt' => $association->getCreatedAt()?->format(\DateTimeInterface::ATOM),
        ];
    }
}
