<?php

namespace App\Service;

use Psr\Log\LoggerInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

/**
 * Géocode une adresse française via l'API Base Adresse Nationale (BAN).
 */
final class AddressGeocoder
{
    private const BAN_SEARCH_URL = 'https://api-adresse.data.gouv.fr/search/';

    public function __construct(
        private readonly HttpClientInterface $httpClient,
        private readonly LoggerInterface $logger,
    ) {
    }

    /**
     * @return array{latitude: float, longitude: float}|null
     */
    public function geocode(string $address): ?array
    {
        $query = trim($address);
        if ('' === $query) {
            return null;
        }

        try {
            $response = $this->httpClient->request('GET', self::BAN_SEARCH_URL, [
                'query' => [
                    'q' => $query,
                    'limit' => 1,
                ],
                'timeout' => 3.0,
            ]);

            if (200 !== $response->getStatusCode()) {
                return null;
            }

            $data = $response->toArray(false);
            $coordinates = $data['features'][0]['geometry']['coordinates'] ?? null;

            if (!is_array($coordinates) || count($coordinates) < 2) {
                return null;
            }

            $longitude = $coordinates[0];
            $latitude = $coordinates[1];

            if (!is_numeric($latitude) || !is_numeric($longitude)) {
                return null;
            }

            return [
                'latitude' => (float) $latitude,
                'longitude' => (float) $longitude,
            ];
        } catch (\Throwable $exception) {
            $this->logger->warning('Échec du géocodage de l’adresse de salle.', [
                'address' => $query,
                'error' => $exception->getMessage(),
            ]);

            return null;
        }
    }
}
