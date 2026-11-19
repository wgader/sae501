<?php

namespace App\Controller;

use App\Entity\Materiel;
use App\Repository\MaterielRepository;
use App\Security\ModuleVoter;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/equipment')]
#[IsGranted(ModuleVoter::EQUIPMENT)]
final class EquipmentCatalogController extends AbstractController
{
    public function __construct(
        private readonly MaterielRepository $materielRepository,
    ) {
    }

    #[Route('', name: 'app_equipment_catalog', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $items = $this->materielRepository->findAvailableForCatalog();

        return $this->json(array_map(
            static fn (Materiel $m): array => EquipmentAdministrationController::serializeEquipment($m),
            $items,
        ));
    }
}
