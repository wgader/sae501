<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\EquipmentCategory;
use App\Exception\EquipmentCategoryInUseException;
use App\Exception\SettingsValidationException;
use App\Repository\EquipmentCategoryRepository;
use App\Repository\MaterielRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\String\Slugger\SluggerInterface;

/** Catégories du catalogue de matériel, gérées par la mairie depuis les réglages. */
class EquipmentCategoryService
{
    /** Catalogue de départ : les cinq catégories historiques et celles demandées par la mairie. */
    public const DEFAULT_CATEGORIES = [
        'mobilier' => 'Mobilier',
        'sonorisation' => 'Sonorisation & Audio',
        'barnums' => 'Barnums & Tentes',
        'eclairage' => 'Éclairage',
        'electricite-chauffage' => 'Électricité & Chauffage',
        'securite-voirie' => 'Sécurité & Voirie',
        'buvette-restauration-proprete' => 'Buvette, Restauration & Propreté',
        'manutention-transport' => 'Manutention & Transport',
        'signaletique-communication' => 'Signalétique & Communication',
        'sport-jeux-animation' => 'Sport, Jeux & Animation',
        'ceremonies-protocole' => 'Cérémonies & Protocole',
        'autre' => 'Autre matériel',
    ];

    public function __construct(
        private readonly EquipmentCategoryRepository $repository,
        private readonly MaterielRepository $materielRepository,
        private readonly EntityManagerInterface $entityManager,
        private readonly SluggerInterface $slugger,
    ) {
    }

    /**
     * @return list<EquipmentCategory>
     */
    public function list(): array
    {
        $categories = $this->repository->findAllOrdered();
        if ($categories !== []) {
            return $categories;
        }

        // Premier accès : le catalogue de départ, plus les catégories libres déjà saisies sur des
        // équipements, pour qu'aucun équipement ne se retrouve sans catégorie connue.
        $defaults = self::DEFAULT_CATEGORIES;
        foreach ($this->materielRepository->findDistinctCategories() as $code) {
            $defaults[$code] ??= mb_convert_case(str_replace('-', ' ', $code), MB_CASE_TITLE);
        }
        foreach ($defaults as $code => $label) {
            $this->entityManager->persist(new EquipmentCategory($code, $label));
        }
        $this->entityManager->flush();

        return $this->repository->findAllOrdered();
    }

    public function exists(string $code): bool
    {
        foreach ($this->list() as $category) {
            if ($category->getCode() === $code) {
                return true;
            }
        }

        return false;
    }

    public function create(mixed $label): EquipmentCategory
    {
        $label = $this->validLabel($label, null);
        $code = $this->uniqueCode($label);

        $category = new EquipmentCategory($code, $label);
        $this->entityManager->persist($category);
        $this->entityManager->flush();

        return $category;
    }

    public function rename(EquipmentCategory $category, mixed $label): EquipmentCategory
    {
        $category->rename($this->validLabel($label, $category));
        $this->entityManager->flush();

        return $category;
    }

    public function delete(EquipmentCategory $category): void
    {
        $count = $this->materielRepository->countByCategory($category->getCode());
        if ($count > 0) {
            throw new EquipmentCategoryInUseException($count);
        }
        if (count($this->repository->findAll()) <= 1) {
            throw new SettingsValidationException(['category' => 'Le catalogue doit garder au moins une catégorie.']);
        }

        $this->entityManager->remove($category);
        $this->entityManager->flush();
    }

    /**
     * @return array{id: int|null, code: string, label: string, equipmentCount: int}
     */
    public function serialize(EquipmentCategory $category): array
    {
        return [
            'id' => $category->getId(),
            'code' => $category->getCode(),
            'label' => $category->getLabel(),
            'equipmentCount' => $this->materielRepository->countByCategory($category->getCode()),
        ];
    }

    private function validLabel(mixed $label, ?EquipmentCategory $current): string
    {
        $label = is_string($label) ? trim(preg_replace('/\s+/u', ' ', $label) ?? '') : '';
        if ($label === '') {
            throw new SettingsValidationException(['label' => 'Le nom de la catégorie est obligatoire.']);
        }
        if (mb_strlen($label) > EquipmentCategory::LABEL_MAX_LENGTH) {
            throw new SettingsValidationException(['label' => sprintf('Le nom ne doit pas dépasser %d caractères.', EquipmentCategory::LABEL_MAX_LENGTH)]);
        }

        $existing = $this->repository->findOneByLabelInsensitive($label);
        if ($existing !== null && $existing !== $current) {
            throw new SettingsValidationException(['label' => 'Une catégorie porte déjà ce nom.']);
        }

        return $label;
    }

    private function uniqueCode(string $label): string
    {
        $base = $this->slugger->slug($label)->lower()->toString() ?: 'categorie';
        $base = mb_substr($base, 0, 90);
        $code = $base;
        for ($suffix = 2; $this->repository->findOneBy(['code' => $code]) !== null; ++$suffix) {
            $code = $base.'-'.$suffix;
        }

        return $code;
    }
}
