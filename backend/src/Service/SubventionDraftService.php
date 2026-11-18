<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Association;
use App\Entity\DemandeSubvention;
use App\Entity\DemandeSubventionLigneBudget;
use App\Repository\DemandeSubventionRepository;
use Doctrine\ORM\EntityManagerInterface;

final class SubventionDraftService
{
    private const TYPES = ['Fonctionnement', 'Projet'];

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly DemandeSubventionRepository $subventionRepository,
    ) {
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function getDrafts(Association $association): array
    {
        return array_map(
            self::serialize(...),
            $this->subventionRepository->findDraftsByAssociation($association),
        );
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function saveDraft(
        Association $association,
        ?DemandeSubvention $draft,
        array $payload,
    ): DemandeSubvention {
        $type = $payload['typeSubvention'] ?? $draft?->getTypeSubvention() ?? 'Projet';
        if (!is_string($type) || !in_array($type, self::TYPES, true)) {
            throw new \InvalidArgumentException('Le type de demande est invalide.');
        }

        $title = $this->optionalString($payload, 'intituleProjet', $draft?->getIntituleProjet() ?? '') ?? '';
        if ('' === trim($title)) {
            throw new \InvalidArgumentException('Le nom de la demande est obligatoire.');
        }
        if (mb_strlen($title) > 255) {
            throw new \InvalidArgumentException('L’intitulé du projet ne peut pas dépasser 255 caractères.');
        }
        $description = $this->optionalString($payload, 'description', $draft?->getDescription());
        $audience = $this->optionalString($payload, 'publicCible', $draft?->getPublicCible());
        $startDate = $this->optionalDate($payload, 'dateDebutProjet', $draft?->getDateDebutProjet());
        $endDate = $this->optionalDate($payload, 'dateFinProjet', $draft?->getDateFinProjet());
        $requestedAmount = $this->optionalMoney($payload, 'montantDemande', $draft?->getMontantDemande());
        $bic = $this->optionalString($payload, 'bic', $draft?->getBic());
        $iban = $this->optionalString($payload, 'iban', $draft?->getIban());
        if (array_key_exists('bic', $payload)) {
            $bic = is_string($payload['bic']) ? strtoupper(preg_replace('/\s+/', '', $payload['bic'])) : '';
            if (!preg_match('/^[A-Z]{6}[A-Z0-9]{2}(?:[A-Z0-9]{3})?$/', $bic)) {
                throw new \InvalidArgumentException('Le BIC doit contenir 8 ou 11 caractères au format bancaire.');
            }
        }
        if (array_key_exists('iban', $payload)) {
            $iban = is_string($payload['iban']) ? strtoupper(preg_replace('/\s+/', '', $payload['iban'])) : '';
            if (!$this->isValidIban($iban)) {
                throw new \InvalidArgumentException('L’IBAN est incomplet ou invalide.');
            }
        }
        $lines = $this->parseLines($payload['lignesBudget'] ?? []);

        if (null === $draft) {
            $draft = (new DemandeSubvention())
                ->setAssociation($association)
                ->setStatut('Brouillon');
            $this->entityManager->persist($draft);
        }

        $draft
            ->setIntituleProjet($title)
            ->setTypeSubvention($type)
            ->setDescription($description)
            ->setPublicCible($audience)
            ->setDateDebutProjet($startDate)
            ->setDateFinProjet($endDate)
            ->setMontantDemande($requestedAmount)
            ->setBic($bic)
            ->setIban($iban)
            ->setAnneeExercice((int) ($startDate?->format('Y') ?? (new \DateTimeImmutable())->format('Y')))
            ->setStatut('Brouillon')
            ->setBudgetValide(false)
            ->setUpdatedAt(new \DateTimeImmutable())
            ->clearLignesBudget();

        foreach ($lines as $line) {
            $draft->addLigneBudget(
                (new DemandeSubventionLigneBudget())
                    ->setTypeLigne($line['type'])
                    ->setCategorie($line['categorie'])
                    ->setIntitule($line['intitule'])
                    ->setMontant($line['montant']),
            );
        }

        $this->entityManager->getConnection()->transactional(
            function (): void {
                $this->entityManager->flush();
            },
        );

        return $draft;
    }

    public function validateBudget(DemandeSubvention $draft): void
    {
        if ('' === trim((string) $draft->getIntituleProjet())) {
            throw new \InvalidArgumentException('L’intitulé du projet est obligatoire.');
        }
        if ('' === trim((string) $draft->getDescription())) {
            throw new \InvalidArgumentException('Les objectifs du projet sont obligatoires.');
        }
        if ('' === trim((string) $draft->getPublicCible())) {
            throw new \InvalidArgumentException('Le public cible est obligatoire.');
        }
        if (null === $draft->getDateDebutProjet() || null === $draft->getDateFinProjet()) {
            throw new \InvalidArgumentException('Les dates de début et de fin sont obligatoires.');
        }
        if ($draft->getDateFinProjet() < $draft->getDateDebutProjet()) {
            throw new \InvalidArgumentException('La date de fin doit être postérieure à la date de début.');
        }

        $requestedAmount = self::toCents($draft->getMontantDemande() ?? '');
        if ($requestedAmount <= 0) {
            throw new \InvalidArgumentException('Le montant demandé doit être un montant positif.');
        }

        $expenses = 0;
        $revenues = 0;
        $municipalGrant = 0;
        $municipalGrantCount = 0;
        foreach ($draft->getLignesBudget() as $line) {
            if ('' === trim($line->getIntitule())) {
                throw new \InvalidArgumentException('Chaque ligne budgétaire doit avoir un intitulé.');
            }

            $amount = self::toCents($line->getMontant());
            if ('depense' === $line->getTypeLigne()) {
                $expenses += $amount;
                continue;
            }

            $revenues += $amount;
            if ('subvention_mairie' === $line->getCategorie()) {
                ++$municipalGrantCount;
                $municipalGrant += $amount;
            }
        }

        if ($expenses !== $revenues) {
            throw new \InvalidArgumentException(sprintf(
                'Le budget doit être équilibré. Dépenses : %s €, recettes : %s €.',
                self::formatCents($expenses),
                self::formatCents($revenues),
            ));
        }
        if (1 !== $municipalGrantCount || $municipalGrant !== $requestedAmount) {
            throw new \InvalidArgumentException(
                'La ligne de recette « Subvention demandée à la mairie » doit correspondre au montant demandé.',
            );
        }

        $draft
            ->setBudgetValide(true)
            ->setStatut('Brouillon')
            ->setUpdatedAt(new \DateTimeImmutable());
        $this->entityManager->flush();
    }

    /**
     * @return array<string, mixed>
     */
    public static function serialize(DemandeSubvention $draft): array
    {
        return [
            'id' => $draft->getId(),
            'statut' => $draft->getStatut(),
            'typeSubvention' => $draft->getTypeSubvention(),
            'intituleProjet' => $draft->getIntituleProjet(),
            'description' => $draft->getDescription(),
            'publicCible' => $draft->getPublicCible(),
            'dateDebutProjet' => $draft->getDateDebutProjet()?->format('Y-m-d'),
            'dateFinProjet' => $draft->getDateFinProjet()?->format('Y-m-d'),
            'montantDemande' => self::normalizeMoney($draft->getMontantDemande() ?? '0'),
            'bic' => $draft->getBic(),
            'iban' => $draft->getIban(),
            'anneeExercice' => $draft->getAnneeExercice(),
            'budgetValide' => $draft->isBudgetValide(),
            'lignesBudget' => array_map(
                static fn (DemandeSubventionLigneBudget $line): array => [
                    'type' => $line->getTypeLigne(),
                    'categorie' => $line->getCategorie(),
                    'intitule' => $line->getIntitule(),
                    'montant' => self::normalizeMoney($line->getMontant()),
                ],
                $draft->getLignesBudget()->toArray(),
            ),
        ];
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function optionalString(array $payload, string $key, ?string $fallback): ?string
    {
        if (!array_key_exists($key, $payload)) {
            return $fallback;
        }
        if (!is_string($payload[$key]) || mb_strlen($payload[$key]) > 5000) {
            throw new \InvalidArgumentException(sprintf('Le champ "%s" est invalide.', $key));
        }

        return trim($payload[$key]);
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function optionalDate(
        array $payload,
        string $key,
        ?\DateTimeImmutable $fallback,
    ): ?\DateTimeImmutable {
        if (!array_key_exists($key, $payload)) {
            return $fallback;
        }
        $value = $payload[$key];
        if (null === $value || '' === $value) {
            return null;
        }
        if (!is_string($value)) {
            throw new \InvalidArgumentException(sprintf('La date "%s" est invalide.', $key));
        }

        $date = \DateTimeImmutable::createFromFormat('!Y-m-d', $value);
        if (false === $date || $date->format('Y-m-d') !== $value) {
            throw new \InvalidArgumentException(sprintf('La date "%s" est invalide.', $key));
        }

        return $date;
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function optionalMoney(array $payload, string $key, ?string $fallback): string
    {
        if (!array_key_exists($key, $payload)) {
            return $fallback ?? '0.00';
        }
        $value = $payload[$key];
        if (null === $value || '' === $value) {
            return '0.00';
        }
        if (!is_string($value) && !is_int($value)) {
            throw new \InvalidArgumentException('Le montant demandé doit être un montant positif.');
        }

        $normalized = self::normalizeMoney((string) $value);
        if (self::toCents($normalized) > 100_000_000) {
            throw new \InvalidArgumentException('Le montant demandé dépasse la limite autorisée de 1 000 000 €.');
        }

        return $normalized;
    }

    /**
     * @return list<array{type: string, categorie: string, intitule: string, montant: string}>
     */
    private function parseLines(mixed $value): array
    {
        if (!is_array($value) || count($value) > 100) {
            throw new \InvalidArgumentException('Les lignes du budget sont invalides.');
        }

        $expenseCategories = ['achats', 'prestations', 'communication', 'logistique', 'autres_depenses'];
        $revenueCategories = ['cotisations', 'recettes_propres', 'autres_subventions', 'autres_recettes', 'subvention_mairie'];
        $lines = [];
        foreach ($value as $line) {
            if (!is_array($line)) {
                throw new \InvalidArgumentException('Une ligne budgétaire est invalide.');
            }

            $type = $line['type'] ?? null;
            $category = $line['categorie'] ?? null;
            $title = $line['intitule'] ?? null;
            $amount = $line['montant'] ?? null;
            if (!is_string($type) || !in_array($type, ['depense', 'recette'], true)) {
                throw new \InvalidArgumentException('Le type d’une ligne budgétaire est invalide.');
            }
            $allowedCategories = 'depense' === $type ? $expenseCategories : $revenueCategories;
            if (!is_string($category) || !in_array($category, $allowedCategories, true)) {
                throw new \InvalidArgumentException('La catégorie d’une ligne budgétaire est invalide.');
            }
            if (!is_string($title) || mb_strlen($title) > 255) {
                throw new \InvalidArgumentException('L’intitulé d’une ligne budgétaire est invalide.');
            }
            if (!is_string($amount) && !is_int($amount)) {
                throw new \InvalidArgumentException('Le montant d’une ligne budgétaire est invalide.');
            }

            $lines[] = [
                'type' => $type,
                'categorie' => $category,
                'intitule' => trim($title),
                'montant' => '' === (string) $amount ? '0.00' : self::normalizeMoney((string) $amount),
            ];
        }

        return $lines;
    }

    private function isValidIban(string $iban): bool
    {
        if (!preg_match('/^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/', $iban) || strlen($iban) < 15 || strlen($iban) > 34) {
            return false;
        }

        $rearranged = substr($iban, 4) . substr($iban, 0, 4);
        $numeric = preg_replace_callback('/[A-Z]/', static fn (array $matches): string =>
            (string) (ord($matches[0]) - 55), $rearranged);
        if (!is_string($numeric)) {
            return false;
        }

        $remainder = 0;
        foreach (str_split($numeric) as $digit) {
            $remainder = (($remainder * 10) + (int) $digit) % 97;
        }

        return 1 === $remainder;
    }

    private static function normalizeMoney(string $value): string
    {
        $value = str_replace(',', '.', $value);
        if (!preg_match('/^\d{1,8}(?:\.\d{0,2})?$/', $value)) {
            throw new \InvalidArgumentException('Le montant demandé doit être un montant positif.');
        }

        [$whole, $fraction] = array_pad(explode('.', $value, 2), 2, '0');

        return sprintf('%d.%02d', (int) $whole, (int) str_pad($fraction, 2, '0'));
    }

    private static function toCents(string $value): int
    {
        [$whole, $fraction] = explode('.', self::normalizeMoney($value));

        return ((int) $whole * 100) + (int) $fraction;
    }

    private static function formatCents(int $cents): string
    {
        return number_format($cents / 100, 2, ',', ' ');
    }
}
