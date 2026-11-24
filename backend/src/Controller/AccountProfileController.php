<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Service\ImageStorage;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/account/profile')]
final class AccountProfileController extends AbstractController
{
    private const PHOTO_FOLDER = 'associations';

    #[Route('', name: 'account_profile_show', methods: ['GET'])]
    public function show(#[CurrentUser] User $user): JsonResponse
    {
        return $this->json(self::serializeProfile($user));
    }

    #[Route('', name: 'account_profile_update', methods: ['PATCH'])]
    public function update(
        Request $request,
        #[CurrentUser] User $user,
        UserRepository $userRepository,
        EntityManagerInterface $entityManager,
        ValidatorInterface $validator,
    ): JsonResponse {
        $payload = json_decode($request->getContent(), true);

        if (!is_array($payload)) {
            return $this->json(
                ['message' => 'Corps de la requête invalide ou JSON malformé.'],
                Response::HTTP_BAD_REQUEST,
            );
        }

        $errors = [];

        if (array_key_exists('email', $payload)) {
            if (!is_string($payload['email']) || '' === trim($payload['email'])) {
                $errors['email'] = "L'adresse email est obligatoire.";
            } else {
                $user->setEmail(trim($payload['email']));
            }
        }

        if (array_key_exists('telephone', $payload)) {
            if (null !== $payload['telephone'] && !is_string($payload['telephone'])) {
                $errors['telephone'] = 'Le numéro de téléphone est invalide.';
            } else {
                $telephone = is_string($payload['telephone']) ? trim($payload['telephone']) : null;
                $user->setTelephone('' === $telephone ? null : $telephone);
            }
        }

        if ([] !== $errors) {
            return $this->json(
                ['message' => 'Données invalides.', 'errors' => $errors],
                Response::HTTP_UNPROCESSABLE_ENTITY,
            );
        }

        if ($userRepository->emailBelongsToAnotherUser($user->getEmail() ?? '', $user->getId())) {
            return $this->json(
                ['message' => 'Cette adresse email est déjà utilisée.', 'errors' => ['email' => 'Cette adresse email est déjà utilisée.']],
                Response::HTTP_CONFLICT,
            );
        }

        foreach ($validator->validate($user) as $violation) {
            $errors[$violation->getPropertyPath()] = $violation->getMessage();
        }

        if ([] !== $errors) {
            return $this->json(
                ['message' => 'Données invalides.', 'errors' => $errors],
                Response::HTTP_UNPROCESSABLE_ENTITY,
            );
        }

        $entityManager->flush();

        return $this->json(self::serializeProfile($user));
    }

    /**
     * Photo de profil de l’association : JPEG, PNG ou WebP de 5 Mo au plus, contenu vérifié.
     * Seul un membre de l’association peut la changer ; l’ancienne image est supprimée.
     */
    #[Route('/photo', name: 'account_profile_photo_update', methods: ['POST'])]
    public function updatePhoto(
        Request $request,
        #[CurrentUser] User $user,
        ImageStorage $imageStorage,
        EntityManagerInterface $entityManager,
    ): JsonResponse {
        $association = $user->getAssociation();
        if (null === $association) {
            return $this->json(['message' => 'Votre compte n’est rattaché à aucune association.'], Response::HTTP_FORBIDDEN);
        }

        $photo = $request->files->get('photo');
        if (!$photo instanceof UploadedFile) {
            return $this->json(['message' => 'Choisissez une image.'], Response::HTTP_BAD_REQUEST);
        }

        try {
            $path = $imageStorage->store($photo, self::PHOTO_FOLDER);
        } catch (\InvalidArgumentException $exception) {
            return $this->json(['message' => $exception->getMessage()], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $previous = $association->getLogoUrl();
        $association->setLogoUrl($path);
        $entityManager->flush();
        if (null !== $previous) {
            $imageStorage->delete($previous, self::PHOTO_FOLDER);
        }

        return $this->json(self::serializeProfile($user));
    }

    #[Route('/photo', name: 'account_profile_photo_delete', methods: ['DELETE'])]
    public function deletePhoto(
        #[CurrentUser] User $user,
        ImageStorage $imageStorage,
        EntityManagerInterface $entityManager,
    ): JsonResponse {
        $association = $user->getAssociation();
        if (null === $association) {
            return $this->json(['message' => 'Votre compte n’est rattaché à aucune association.'], Response::HTTP_FORBIDDEN);
        }

        $previous = $association->getLogoUrl();
        $association->setLogoUrl(null);
        $entityManager->flush();
        if (null !== $previous) {
            $imageStorage->delete($previous, self::PHOTO_FOLDER);
        }

        return $this->json(self::serializeProfile($user));
    }

    /**
     * @return array{ id: int|null, email: string|null, telephone: string|null, nom: string|null, prenom: string|null, nomAssociation: string|null, logoUrl: string|null, typeCompte: string|null, moduleSubventionActif: bool|null, moduleMaterielActif: bool|null, moduleSalleActif: bool|null, moduleEvenementActif: bool|null }
     */
    private static function serializeProfile(User $user): array
    {
        return [
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'telephone' => $user->getTelephone(),
            'nom' => $user->getNom(),
            'prenom' => $user->getPrenom(),
            'nomAssociation' => $user->getAssociation()?->getNom(),
            'logoUrl' => $user->getAssociation()?->getLogoUrl(),
            'typeCompte' => $user->getTypeCompte(),
            'moduleSubventionActif' => $user->getAssociation()?->isModuleSubventionActif(),
            'moduleMaterielActif' => $user->getAssociation()?->isModuleMaterielActif(),
            'moduleSalleActif' => $user->getAssociation()?->isModuleSalleActif(),
            'moduleEvenementActif' => $user->getAssociation()?->isModuleEvenementActif(),
        ];
    }
}
