<?php

declare(strict_types=1);

namespace App\Controller;

use App\Service\AdminDashboardService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/** Accueil de l’administration : une seule requête pour toute la vue d’ensemble. */
#[IsGranted('ROLE_ADMIN')]
final class AdminDashboardController extends AbstractController
{
    #[Route('/api/admin/dashboard', name: 'admin_dashboard', methods: ['GET'])]
    public function __invoke(AdminDashboardService $dashboard): JsonResponse
    {
        return $this->json($dashboard->overview(new \DateTimeImmutable()));
    }
}
