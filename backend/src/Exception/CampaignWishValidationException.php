<?php

declare(strict_types=1);

namespace App\Exception;

/**
 * Dossier de vœux refusé : chaque erreur indique la ligne (à partir de 1) et le champ concernés,
 * pour que le formulaire les mette en évidence.
 */
final class CampaignWishValidationException extends \RuntimeException
{
    /**
     * @param list<array{line: int|null, field: string|null, message: string}> $errors
     */
    public function __construct(private readonly array $errors)
    {
        parent::__construct($errors[0]['message'] ?? 'Le dossier de vœux est invalide.');
    }

    /**
     * @return list<array{line: int|null, field: string|null, message: string}>
     */
    public function getErrors(): array
    {
        return $this->errors;
    }
}
