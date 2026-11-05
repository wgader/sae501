<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/account/profile')]
final class AccountProfileController extends AbstractController
{
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
            if (!is_string($payload['email']) || trim($payload['email']) === '') {
                $errors['email'] = "L'adresse email est obligatoire.";
            } else {
                $user->setEmail(trim($payload['email']));
            }
        }

        if (array_key_exists('telephone', $payload)) {
            if ($payload['telephone'] !== null && !is_string($payload['telephone'])) {
                $errors['telephone'] = 'Le numéro de téléphone est invalide.';
            } else {
                $telephone = is_string($payload['telephone']) ? trim($payload['telephone']) : null;
                $user->setTelephone($telephone === '' ? null : $telephone);
            }
        }

        if ($errors !== []) {
            return $this->json(
                ['message' => 'Données invalides.', 'errors' => $errors],
                Response::HTTP_UNPROCESSABLE_ENTITY,
            );
        }

        if ($userRepository->findOneBy(['email' => $user->getEmail()])?->getId() !== $user->getId()) {
            return $this->json(
                ['message' => 'Cette adresse email est déjà utilisée.', 'errors' => ['email' => 'Cette adresse email est déjà utilisée.']],
                Response::HTTP_CONFLICT,
            );
        }

        foreach ($validator->validate($user) as $violation) {
            $errors[$violation->getPropertyPath()] = $violation->getMessage();
        }

        if ($errors !== []) {
            return $this->json(
                ['message' => 'Données invalides.', 'errors' => $errors],
                Response::HTTP_UNPROCESSABLE_ENTITY,
            );
        }

        $entityManager->flush();

        return $this->json(self::serializeProfile($user));
    }

    /**
     * @return array{ id: int|null, email: string|null, telephone: string|null, nom: string|null, prenom: string|null, nomAssociation: string|null, typeCompte: string|null }
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
            'typeCompte' => $user->getTypeCompte(),
        ];
    }
}
