<?php

namespace App\Tests\Service;

use App\Service\AddressGeocoder;
use PHPUnit\Framework\TestCase;
use Psr\Log\NullLogger;
use Symfony\Component\HttpClient\MockHttpClient;
use Symfony\Component\HttpClient\Response\MockResponse;

final class AddressGeocoderTest extends TestCase
{
    public function testGeocodeReturnsLatitudeAndLongitudeFromBanResponse(): void
    {
        $payload = json_encode([
            'features' => [
                [
                    'geometry' => [
                        'coordinates' => [1.3318, 45.8095],
                    ],
                ],
            ],
        ], JSON_THROW_ON_ERROR);

        $geocoder = new AddressGeocoder(
            new MockHttpClient(new MockResponse($payload, ['http_code' => 200])),
            new NullLogger(),
        );

        $result = $geocoder->geocode('1 rue de la Mairie, 87220 Feytiat');

        self::assertSame([
            'latitude' => 45.8095,
            'longitude' => 1.3318,
        ], $result);
    }

    public function testGeocodeReturnsNullWhenNoFeatureMatches(): void
    {
        $payload = json_encode(['features' => []], JSON_THROW_ON_ERROR);

        $geocoder = new AddressGeocoder(
            new MockHttpClient(new MockResponse($payload, ['http_code' => 200])),
            new NullLogger(),
        );

        self::assertNull($geocoder->geocode('Adresse introuvable'));
    }

    public function testGeocodeReturnsNullOnHttpFailure(): void
    {
        $geocoder = new AddressGeocoder(
            new MockHttpClient(new MockResponse('', ['http_code' => 503])),
            new NullLogger(),
        );

        self::assertNull($geocoder->geocode('1 rue de la Mairie, 87220 Feytiat'));
    }
}
