<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\User;
use App\Security\ModuleVoter;
use App\Service\ImageStorage;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

/**
 * Images des salles, du matériel et des logos : servies uniquement aux comptes autorisés,
 * jamais directement par le serveur web.
 */
final class MediaController extends AbstractController
{
    public function __construct(private readonly ImageStorage $imageStorage)
    {
    }

    #[Route(
        '/uploads/{folder}/{filename}',
        name: 'app_media',
        requirements: ['folder' => 'salles|equipment|associations', 'filename' => '[a-f0-9]{48}\.(jpg|png|webp)'],
        methods: ['GET'],
    )]
    public function show(string $folder, string $filename, #[CurrentUser] User $user): BinaryFileResponse
    {
        match ($folder) {
            'salles' => $this->denyAccessUnlessGranted(ModuleVoter::ROOMS),
            'equipment' => $this->denyAccessUnlessGranted(ModuleVoter::EQUIPMENT),
            'associations' => $this->denyUnlessLogoVisible($user, '/uploads/associations/'.$filename),
            default => throw $this->createNotFoundException('Image introuvable.'),
        };

        $path = $this->imageStorage->locate($folder, $filename)
            ?? throw $this->createNotFoundException('Image introuvable.');

        $response = new BinaryFileResponse($path);
        $response->setPrivate();
        $response->setMaxAge(3600);
        $response->setContentDisposition(ResponseHeaderBag::DISPOSITION_INLINE, $filename);
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        return $response;
    }

    /** Un logo n'est visible que par les membres de son association et par la mairie. */
    private function denyUnlessLogoVisible(User $user, string $logoPath): void
    {
        $isTownHall = 'mairie' === $user->getTypeCompte();
        $isOwnLogo = $user->getAssociation()?->getLogoUrl() === $logoPath;

        if (!$isTownHall && !$isOwnLogo) {
            throw $this->createAccessDeniedException('Cette image ne vous est pas accessible.');
        }
    }
}
