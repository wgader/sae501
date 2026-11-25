<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\AppSettings;
use App\Entity\Materiel;
use App\Entity\User;
use App\Exception\SettingsValidationException;
use App\Repository\AppSettingsRepository;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Lit et modifie les réglages de la plateforme. Chaque valeur est contrôlée ici : le
 * formulaire de la mairie n'est qu'une première aide, jamais la seule barrière.
 */
class AppSettingsService
{
    public const ROOM_ONE_OFF_MAX_DAYS_LIMIT = 14;
    public const EQUIPMENT_MAX_QUANTITY_LIMIT = 1000;
    public const PICKUP_LOCATION_MAX_LENGTH = 255;
    /** Le service de prêt doit rester ouvert au moins une demi-heure. */
    private const MIN_DESK_MINUTES = 30;

    private ?AppSettings $current = null;

    public function __construct(
        private readonly AppSettingsRepository $repository,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    /** Sans ligne enregistrée, les valeurs par défaut s'appliquent sans rien écrire en base. */
    public function current(): AppSettings
    {
        return $this->current ??= $this->repository->findCurrent() ?? new AppSettings();
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function updateRooms(array $payload, ?User $agent): AppSettings
    {
        $errors = [];
        $opening = $this->readInt($payload, 'openingHour', 0, 23, 'L’heure d’ouverture doit être comprise entre 0 h et 23 h.', $errors);
        $closing = $this->readInt($payload, 'closingHour', 1, 24, 'L’heure de fermeture doit être comprise entre 1 h et 24 h.', $errors);
        $maxDays = $this->readInt(
            $payload,
            'oneOffMaxDays',
            1,
            self::ROOM_ONE_OFF_MAX_DAYS_LIMIT,
            sprintf('La durée maximale doit être comprise entre 1 et %d jours.', self::ROOM_ONE_OFF_MAX_DAYS_LIMIT),
            $errors,
        );

        if (null !== $opening && null !== $closing && $closing <= $opening) {
            $errors['closingHour'] = 'La fermeture doit être après l’ouverture.';
        }
        if ([] !== $errors) {
            throw new SettingsValidationException($errors);
        }

        $settings = $this->current();
        $settings->updateRooms((int) $opening, (int) $closing, (int) $maxDays);

        return $this->save($settings, $agent);
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function updateEquipment(array $payload, ?User $agent): AppSettings
    {
        $errors = [];
        $opening = $this->readTime($payload, 'deskOpening', $errors);
        $closing = $this->readTime($payload, 'deskClosing', $errors);
        if (null !== $opening && null !== $closing && self::toMinutes($closing) - self::toMinutes($opening) < self::MIN_DESK_MINUTES) {
            $errors['deskClosing'] = 'La fermeture doit suivre l’ouverture d’au moins 30 minutes.';
        }

        $location = $payload['pickupLocation'] ?? null;
        if (null !== $location && !is_string($location)) {
            $errors['pickupLocation'] = 'Le lieu de retrait doit être un texte.';
            $location = null;
        }
        $location = null === $location || '' === trim($location) ? null : trim($location);
        if (null !== $location && mb_strlen($location) > self::PICKUP_LOCATION_MAX_LENGTH) {
            $errors['pickupLocation'] = sprintf('Le lieu de retrait ne doit pas dépasser %d caractères.', self::PICKUP_LOCATION_MAX_LENGTH);
        }

        $maxQuantity = null;
        if (($payload['maxQuantityPerRequest'] ?? null) !== null) {
            $maxQuantity = $this->readInt(
                $payload,
                'maxQuantityPerRequest',
                1,
                self::EQUIPMENT_MAX_QUANTITY_LIMIT,
                sprintf('La quantité maximale doit être comprise entre 1 et %d, ou laissée vide.', self::EQUIPMENT_MAX_QUANTITY_LIMIT),
                $errors,
            );
        }

        $defaultMaxDays = $this->readInt(
            $payload,
            'defaultMaxDays',
            1,
            Materiel::MAX_CONSECUTIVE_DAYS_LIMIT,
            sprintf('La durée de prêt doit être comprise entre 1 et %d jours.', Materiel::MAX_CONSECUTIVE_DAYS_LIMIT),
            $errors,
        );

        if ([] !== $errors) {
            throw new SettingsValidationException($errors);
        }

        $settings = $this->current();
        $settings->updateEquipment((string) $opening, (string) $closing, $location, $maxQuantity, (int) $defaultMaxDays);

        return $this->save($settings, $agent);
    }

    /**
     * @return array<string, mixed>
     */
    public function serializeRooms(): array
    {
        $settings = $this->current();

        return [
            'openingHour' => $settings->getRoomOpeningHour(),
            'closingHour' => $settings->getRoomClosingHour(),
            'oneOffMaxDays' => $settings->getRoomOneOffMaxDays(),
            'limits' => ['oneOffMaxDays' => self::ROOM_ONE_OFF_MAX_DAYS_LIMIT],
        ] + $this->audit($settings);
    }

    /**
     * @return array<string, mixed>
     */
    public function serializeEquipment(): array
    {
        $settings = $this->current();

        return [
            'deskOpening' => $settings->getEquipmentDeskOpening(),
            'deskClosing' => $settings->getEquipmentDeskClosing(),
            'pickupLocation' => $settings->getEquipmentPickupLocation(),
            'maxQuantityPerRequest' => $settings->getEquipmentMaxQuantityPerRequest(),
            'defaultMaxDays' => $settings->getEquipmentDefaultMaxDays(),
            'limits' => [
                'maxQuantityPerRequest' => self::EQUIPMENT_MAX_QUANTITY_LIMIT,
                'defaultMaxDays' => Materiel::MAX_CONSECUTIVE_DAYS_LIMIT,
                'pickupLocation' => self::PICKUP_LOCATION_MAX_LENGTH,
            ],
        ] + $this->audit($settings);
    }

    public static function toMinutes(string $time): int
    {
        [$hours, $minutes] = array_map('intval', explode(':', $time));

        return $hours * 60 + $minutes;
    }

    private function save(AppSettings $settings, ?User $agent): AppSettings
    {
        $settings->touch($agent);
        $this->entityManager->persist($settings);
        $this->entityManager->flush();

        return $settings;
    }

    /**
     * @return array{updatedAt: string|null, updatedBy: string|null}
     */
    private function audit(AppSettings $settings): array
    {
        $agent = $settings->getUpdatedBy();

        return [
            'updatedAt' => $settings->getUpdatedAt()?->format(\DateTimeInterface::ATOM),
            'updatedBy' => null !== $agent ? trim(sprintf('%s %s', $agent->getPrenom(), $agent->getNom())) : null,
        ];
    }

    /**
     * @param array<string, mixed>  $payload
     * @param array<string, string> $errors
     */
    private function readInt(array $payload, string $field, int $min, int $max, string $message, array &$errors): ?int
    {
        $value = $payload[$field] ?? null;
        if (is_string($value) && 1 === preg_match('/^\d+$/', $value)) {
            $value = (int) $value;
        }
        if (!is_int($value) || $value < $min || $value > $max) {
            $errors[$field] = $message;

            return null;
        }

        return $value;
    }

    /**
     * @param array<string, mixed>  $payload
     * @param array<string, string> $errors
     */
    private function readTime(array $payload, string $field, array &$errors): ?string
    {
        $value = $payload[$field] ?? null;
        if (!is_string($value) || 1 !== preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $value)) {
            $errors[$field] = 'Indiquez une heure au format HH:mm.';

            return null;
        }

        return $value;
    }
}
