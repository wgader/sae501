<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\LegalContent;
use App\Entity\User;
use App\Exception\SettingsValidationException;
use App\Repository\LegalContentRepository;
use Doctrine\ORM\EntityManagerInterface;

final class LegalContentService
{
    public const DEFAULT_CGU_SECTIONS = [
        [
            'title' => '1. Objet',
            'text' => "Les présentes conditions définissent les règles d'accès et d'utilisation du service. La création d'un compte signifie que vous acceptez ces conditions dans leur intégralité.",
        ],
        [
            'title' => '2. Création du compte',
            'text' => "Vous devez fournir des informations exactes et à jour. Votre compte est personnel : vous êtes responsable de la confidentialité de vos identifiants et de toute activité réalisée depuis celui-ci.",
        ],
        [
            'title' => '3. Données personnelles',
            'text' => "Les coordonnées du contact de l'association sont utilisées pour instruire le dossier, sécuriser l'accès au service et transmettre les notifications liées à la demande. Elles ne sont pas vendues.",
        ],
        [
            'title' => '4. Utilisation du service',
            'text' => "Vous vous engagez à utiliser le service de manière légale, respectueuse et conforme à sa finalité. Toute utilisation frauduleuse ou tentative d'accès non autorisé peut entraîner la suspension du compte.",
        ],
        [
            'title' => '5. Contact',
            'text' => "Pour toute question concernant ces conditions ou l'exercice de vos droits, adressez-vous à la mairie de Feytiat via le canal de contact indiqué sur le portail.",
        ],
    ];

    public const DEFAULT_MENTIONS_SECTIONS = [
        [
            'title' => '1. Éditeur du site',
            'text' => "Ville de Feytiat\nPlace de la Mairie, 87220 Feytiat\nTéléphone : 05 55 48 43 00\nCourriel : contact@ville-feytiat.fr\nDirecteur de la publication : Le Maire de Feytiat.",
        ],
        [
            'title' => '2. Hébergement',
            'text' => "Ce portail est hébergé sur les infrastructures sécurisées de la commune de Feytiat / Limoges Métropole.",
        ],
        [
            'title' => '3. Propriété intellectuelle',
            'text' => "L'ensemble de ce site relève de la législation française et internationale sur le droit d'auteur et la propriété intellectuelle. Tous les droits de reproduction sont réservés.",
        ],
        [
            'title' => '4. Protection des données personnelles (RGPD)',
            'text' => "Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés, les informations recueillies font l'objet d'un traitement destiné à la gestion des demandes associatives. Vous disposez d'un droit d'accès, de rectification et de suppression des informations vous concernant en contactant la mairie.",
        ],
    ];

    public function __construct(
        private readonly LegalContentRepository $repository,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    /**
     * @return array{id: int, type: string, title: string, subtitle: string|null, lastUpdated: string|null, sections: list<array{title: string, text: string}>, updatedAt: string|null, updatedBy: string|null}
     */
    public function get(string $type): array
    {
        $content = $this->repository->findByType($type);
        if ($content === null) {
            $content = $this->seedDefault($type);
        }

        return $this->serialize($content);
    }

    /**
     * @param array<string, mixed> $payload
     * @return array{id: int, type: string, title: string, subtitle: string|null, lastUpdated: string|null, sections: list<array{title: string, text: string}>, updatedAt: string|null, updatedBy: string|null}
     */
    public function update(string $type, array $payload, ?User $agent): array
    {
        $content = $this->repository->findByType($type) ?? new LegalContent($type);

        $title = trim((string) ($payload['title'] ?? $content->getTitle()));
        if ($title === '') {
            throw new SettingsValidationException(['title' => 'Le titre est obligatoire.']);
        }
        $content->setTitle($title);

        if (array_key_exists('subtitle', $payload)) {
            $content->setSubtitle($payload['subtitle'] !== null ? trim((string) $payload['subtitle']) : null);
        }
        if (array_key_exists('lastUpdated', $payload)) {
            $content->setLastUpdated($payload['lastUpdated'] !== null ? trim((string) $payload['lastUpdated']) : null);
        }
        if (isset($payload['sections']) && is_array($payload['sections'])) {
            $sections = [];
            foreach ($payload['sections'] as $sec) {
                if (is_array($sec) && isset($sec['title'], $sec['text'])) {
                    $sections[] = [
                        'title' => trim((string) $sec['title']),
                        'text' => trim((string) $sec['text']),
                    ];
                }
            }
            $content->setSections($sections);
        }

        $content->touch($agent);
        $this->entityManager->persist($content);
        $this->entityManager->flush();

        return $this->serialize($content);
    }

    /**
     * @return array{id: int, type: string, title: string, subtitle: string|null, lastUpdated: string|null, sections: list<array{title: string, text: string}>, updatedAt: string|null, updatedBy: string|null}
     */
    public function serialize(LegalContent $content): array
    {
        $agent = $content->getUpdatedBy();

        return [
            'id' => (int) $content->getId(),
            'type' => $content->getType(),
            'title' => $content->getTitle(),
            'subtitle' => $content->getSubtitle(),
            'lastUpdated' => $content->getLastUpdated(),
            'sections' => $content->getSections(),
            'updatedAt' => $content->getUpdatedAt()?->format(\DateTimeInterface::ATOM),
            'updatedBy' => $agent !== null ? trim(sprintf('%s %s', $agent->getPrenom(), $agent->getNom())) : null,
        ];
    }

    private function seedDefault(string $type): LegalContent
    {
        $content = new LegalContent($type);
        if ($type === LegalContent::TYPE_CGU) {
            $content->setTitle("Conditions générales d'utilisation");
            $content->setSubtitle('Informations légales');
            $content->setLastUpdated('15 septembre 2026');
            $content->setSections(self::DEFAULT_CGU_SECTIONS);
        } else {
            $content->setTitle('Mentions légales');
            $content->setSubtitle('Informations légales et administratives');
            $content->setLastUpdated('15 septembre 2026');
            $content->setSections(self::DEFAULT_MENTIONS_SECTIONS);
        }

        $this->entityManager->persist($content);
        $this->entityManager->flush();

        return $content;
    }
}
