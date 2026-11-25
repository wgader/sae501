<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\GrantDocumentType;
use App\Entity\GrantResource;
use App\Exception\SettingsValidationException;
use App\Repository\GrantDocumentTypeRepository;
use App\Repository\GrantResourceRepository;
use Doctrine\ORM\EntityManagerInterface;

final class GrantConfigService
{
    /** Valeurs par défaut si la table est vide */
    public const DEFAULT_DOCUMENT_TYPES = [
        ['label' => 'Rapport moral', 'isRequired' => true, 'displayOrder' => 1],
        ['label' => 'Bilan d’activité récente', 'isRequired' => true, 'displayOrder' => 2],
        ['label' => 'Autre justificatif', 'isRequired' => false, 'displayOrder' => 3],
    ];

    public const DEFAULT_RESOURCES = [
        ['label' => 'Formulaire de subvention (Cerfa)', 'url' => '/assets/cerfa_12156-06-1.pdf', 'isExternal' => false, 'displayOrder' => 1],
        ['label' => 'Notice du formulaire', 'url' => '/assets/notice_5178104-1.pdf', 'isExternal' => false, 'displayOrder' => 2],
        ['label' => 'Contrat d’engagement républicain, affiche', 'url' => 'https://www.ville-feytiat.fr/wp-content/uploads/2022/09/22-01-Contrat-Engagement-Republicain-affiche.pdf', 'isExternal' => true, 'displayOrder' => 3],
        ['label' => 'Décret n° 2021-1947 du 31 décembre 2021', 'url' => 'https://www.ville-feytiat.fr/wp-content/uploads/2022/09/2021-12-decret-2021-1947-du-31-decembre-2021-_-contrat-dengagement-republicain.pdf', 'isExternal' => true, 'displayOrder' => 4],
    ];

    public function __construct(
        private readonly GrantDocumentTypeRepository $documentTypeRepository,
        private readonly GrantResourceRepository $resourceRepository,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    /**
     * @return list<array{id: int, label: string, isRequired: bool, displayOrder: int}>
     */
    public function listDocumentTypes(): array
    {
        $types = $this->documentTypeRepository->findAllOrdered();
        if ($types === []) {
            $this->seedDefaultDocumentTypes();
            $types = $this->documentTypeRepository->findAllOrdered();
        }

        return array_map($this->serializeDocumentType(...), $types);
    }

    public function createDocumentType(?string $label, bool $isRequired, int $displayOrder = 0): GrantDocumentType
    {
        $clean = trim((string) $label);
        if ($clean === '') {
            throw new SettingsValidationException(['label' => 'Le libellé du document est obligatoire.']);
        }
        if ($this->documentTypeRepository->findOneBy(['label' => $clean]) !== null) {
            throw new SettingsValidationException(['label' => 'Un type de document porte déjà ce nom.']);
        }

        $type = new GrantDocumentType($clean, $isRequired, $displayOrder);
        $this->entityManager->persist($type);
        $this->entityManager->flush();

        return $type;
    }

    public function updateDocumentType(GrantDocumentType $type, ?string $label, ?bool $isRequired, ?int $displayOrder): GrantDocumentType
    {
        if ($label !== null) {
            $clean = trim($label);
            if ($clean === '') {
                throw new SettingsValidationException(['label' => 'Le libellé ne peut pas être vide.']);
            }
            $existing = $this->documentTypeRepository->findOneBy(['label' => $clean]);
            if ($existing !== null && $existing->getId() !== $type->getId()) {
                throw new SettingsValidationException(['label' => 'Un type de document porte déjà ce nom.']);
            }
            $type->setLabel($clean);
        }
        if ($isRequired !== null) {
            $type->setIsRequired($isRequired);
        }
        if ($displayOrder !== null) {
            $type->setDisplayOrder($displayOrder);
        }

        $this->entityManager->flush();

        return $type;
    }

    public function deleteDocumentType(GrantDocumentType $type): void
    {
        $this->entityManager->remove($type);
        $this->entityManager->flush();
    }

    /**
     * @return list<array{id: int, label: string, url: string, isExternal: bool, displayOrder: int}>
     */
    public function listResources(): array
    {
        $resources = $this->resourceRepository->findAllOrdered();
        if ($resources === []) {
            $this->seedDefaultResources();
            $resources = $this->resourceRepository->findAllOrdered();
        }

        return array_map($this->serializeResource(...), $resources);
    }

    public function createResource(?string $label, ?string $url, bool $isExternal, int $displayOrder = 0): GrantResource
    {
        $cleanLabel = trim((string) $label);
        $cleanUrl = trim((string) $url);
        $errors = [];
        if ($cleanLabel === '') {
            $errors['label'] = 'Le libellé de la ressource est obligatoire.';
        }
        if ($cleanUrl === '') {
            $errors['url'] = 'L’URL ou le chemin du document est obligatoire.';
        }
        if ($errors !== []) {
            throw new SettingsValidationException($errors);
        }

        $resource = new GrantResource($cleanLabel, $cleanUrl, $isExternal, $displayOrder);
        $this->entityManager->persist($resource);
        $this->entityManager->flush();

        return $resource;
    }

    public function updateResource(GrantResource $resource, ?string $label, ?string $url, ?bool $isExternal, ?int $displayOrder): GrantResource
    {
        if ($label !== null) {
            $clean = trim($label);
            if ($clean === '') {
                throw new SettingsValidationException(['label' => 'Le libellé ne peut pas être vide.']);
            }
            $resource->setLabel($clean);
        }
        if ($url !== null) {
            $clean = trim($url);
            if ($clean === '') {
                throw new SettingsValidationException(['url' => 'L’URL ne peut pas être vide.']);
            }
            $resource->setUrl($clean);
        }
        if ($isExternal !== null) {
            $resource->setIsExternal($isExternal);
        }
        if ($displayOrder !== null) {
            $resource->setDisplayOrder($displayOrder);
        }

        $this->entityManager->flush();

        return $resource;
    }

    public function deleteResource(GrantResource $resource): void
    {
        $this->entityManager->remove($resource);
        $this->entityManager->flush();
    }

    /**
     * @return array{id: int, label: string, isRequired: bool, displayOrder: int}
     */
    public function serializeDocumentType(GrantDocumentType $type): array
    {
        return [
            'id' => (int) $type->getId(),
            'label' => $type->getLabel(),
            'isRequired' => $type->isRequired(),
            'displayOrder' => $type->getDisplayOrder(),
        ];
    }

    /**
     * @return array{id: int, label: string, url: string, isExternal: bool, displayOrder: int}
     */
    public function serializeResource(GrantResource $resource): array
    {
        return [
            'id' => (int) $resource->getId(),
            'label' => $resource->getLabel(),
            'url' => $resource->getUrl(),
            'isExternal' => $resource->isExternal(),
            'displayOrder' => $resource->getDisplayOrder(),
        ];
    }

    private function seedDefaultDocumentTypes(): void
    {
        foreach (self::DEFAULT_DOCUMENT_TYPES as $data) {
            $type = new GrantDocumentType($data['label'], (bool) $data['isRequired'], (int) $data['displayOrder']);
            $this->entityManager->persist($type);
        }
        $this->entityManager->flush();
    }

    private function seedDefaultResources(): void
    {
        foreach (self::DEFAULT_RESOURCES as $data) {
            $resource = new GrantResource($data['label'], $data['url'], (bool) $data['isExternal'], (int) $data['displayOrder']);
            $this->entityManager->persist($resource);
        }
        $this->entityManager->flush();
    }
}
