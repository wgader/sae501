<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\ReservationMateriel;
use App\Entity\User;
use App\Service\EquipmentReservationPdfService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\HeaderUtils;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\String\Slugger\AsciiSlugger;

#[Route('/api/equipment/reservations')]
#[IsGranted('ROLE_USER')]
final class EquipmentReservationPdfController extends AbstractController
{
    public function __construct(
        private readonly EquipmentReservationPdfService $pdfService,
    ) {
    }

    #[Route('/{id<\d+>}/pdf', name: 'equipment_reservation_pdf', methods: ['GET'])]
    #[Route('/{id<\d+>}/voucher.pdf', name: 'equipment_reservation_voucher_pdf', methods: ['GET'])]
    public function download(
        ReservationMateriel $reservation,
        #[CurrentUser] User $user,
        Request $request,
    ): Response {
        $isMunicipalAgent = $this->isGranted('ROLE_ADMIN') || $this->isGranted('ROLE_GESTION_MATERIEL');
        $isOwner = $user->getAssociation()?->getId() === $reservation->getAssociation()?->getId();
        $provisional = $request->query->getBoolean('provisional');

        if (!$isMunicipalAgent && !$isOwner) {
            throw $this->createAccessDeniedException();
        }

        if ($provisional && !$isMunicipalAgent) {
            throw $this->createAccessDeniedException();
        }

        $provisionalStatuses = ['En attente', 'En cours de traitement', 'Complément requis'];
        if ($provisional && !in_array($reservation->getStatut(), $provisionalStatuses, true)) {
            return $this->json(
                ['message' => 'Le PDF provisoire est disponible uniquement pour un dossier en attente de validation.'],
                Response::HTTP_UNPROCESSABLE_ENTITY,
            );
        }

        $officialStatuses = ["Valid\u{00e9}e", 'Clôturée'];
        if (!$provisional && !in_array($reservation->getStatut(), $officialStatuses, true)) {
            return $this->json(
                ['message' => 'Le bon de reservation est disponible uniquement pour une reservation validee ou clôturée.'],
                Response::HTTP_UNPROCESSABLE_ENTITY,
            );
        }

        try {
            $pdf = $this->pdfService->generate($reservation, $provisional);
        } catch (\RuntimeException $exception) {
            return $this->json(['message' => $exception->getMessage()], Response::HTTP_SERVICE_UNAVAILABLE);
        }

        $associationName = (string) ($reservation->getAssociation()?->getNom() ?? 'association');
        $documentName = $provisional ? 'bon-reservation-provisoire-' : 'bon-reservation-';
        $filename = (new AsciiSlugger('fr'))->slug($documentName.$associationName.'-'.$reservation->getId())->lower().'.pdf';
        $etag = '"'.hash('sha256', $pdf).'"';

        if ($request->headers->get('If-None-Match') === $etag) {
            return new Response('', Response::HTTP_NOT_MODIFIED, [
                'Etag' => $etag,
                'Cache-Control' => $provisional ? 'private, no-store' : 'private, max-age=3600, must-revalidate',
            ]);
        }

        return new Response($pdf, Response::HTTP_OK, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => HeaderUtils::makeDisposition(HeaderUtils::DISPOSITION_ATTACHMENT, $filename),
            'Etag' => $etag,
            'Cache-Control' => $provisional ? 'private, no-store' : 'private, max-age=3600, must-revalidate',
        ]);
    }
}
