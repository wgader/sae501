<?php

declare(strict_types=1);

namespace App\Exception;

/** Réglages refusés : chaque champ en erreur porte son message, affiché sous le champ. */
final class SettingsValidationException extends \InvalidArgumentException
{
    /**
     * @param array<string, string> $errors
     */
    public function __construct(private readonly array $errors)
    {
        parent::__construct('Certains réglages sont invalides.');
    }

    /**
     * @return array<string, string>
     */
    public function getErrors(): array
    {
        return $this->errors;
    }
}
