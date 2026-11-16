<?php

declare(strict_types=1);

namespace App\Security;

use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\Validator\ValidatorInterface;

/**
 * Règles communes aux mots de passe choisis à l’activation et à la réinitialisation.
 */
final class PasswordPolicy
{
    public function __construct(private readonly ValidatorInterface $validator)
    {
    }

    /**
     * @return list<string> messages d’erreur, vide si le mot de passe est accepté
     */
    public function violations(string $password): array
    {
        $violations = $this->validator->validate($password, [
            new Assert\NotBlank(),
            new Assert\Length(min: 10, max: 4096, minMessage: 'Le mot de passe doit contenir au moins 10 caractères.'),
            new Assert\Regex(pattern: '/[A-Z]/', message: 'Le mot de passe doit contenir au moins une majuscule.'),
            new Assert\Regex(pattern: '/[a-z]/', message: 'Le mot de passe doit contenir au moins une minuscule.'),
            new Assert\Regex(pattern: '/[0-9]/', message: 'Le mot de passe doit contenir au moins un chiffre.'),
        ]);

        $messages = [];
        foreach ($violations as $violation) {
            $messages[] = (string) $violation->getMessage();
        }

        return $messages;
    }
}
