<?php

declare(strict_types=1);

namespace App\Tests\Unit\Service;

use App\Entity\Association;
use App\Entity\Materiel;
use App\Entity\ReservationMateriel;
use App\Entity\ReservationMaterielLigne;
use App\Service\EquipmentReservationPdfService;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Cache\Adapter\ArrayAdapter;
use Symfony\Component\HttpClient\MockHttpClient;
use Symfony\Component\HttpClient\Response\MockResponse;
use Twig\Environment;
use Twig\Loader\ArrayLoader;

final class EquipmentReservationPdfServiceTest extends TestCase
{
    public function testValidatedReservationPdfIsGeneratedOnlyOnce(): void
    {
        $calls = 0;
        $httpClient = new MockHttpClient(
            static function () use (&$calls): MockResponse {
                ++$calls;

                return new MockResponse('%PDF-1.7 cached document');
            },
        );
        $twig = new Environment(new ArrayLoader([
            'pdf/equipment_reservation.html.twig' => '{{ reservation.id }}',
        ]));
        $logoPath = dirname(__DIR__, 3).'/public/assets/logo-feytiat.svg';
        $service = new EquipmentReservationPdfService(
            $twig,
            'http://gotenberg:3000',
            $logoPath,
            $httpClient,
            new ArrayAdapter(),
        );

        $reservation = $this->createReservation();

        self::assertSame('%PDF-1.7 cached document', $service->generate($reservation));
        self::assertSame('%PDF-1.7 cached document', $service->generate($reservation));
        self::assertSame(1, $calls);
    }

    private function createReservation(): ReservationMateriel
    {
        $association = (new Association())
            ->setNom('Association des tests')
            ->setStatut('VALIDATED');
        $equipment = (new Materiel())
            ->setDesignation('Table pliante')
            ->setCategorie('Mobilier')
            ->setReferenceInterne('TAB-001')
            ->setStockTotal(10);
        $reservation = (new ReservationMateriel())
            ->setAssociation($association)
            ->setMotifEvenement('Assemblée générale')
            ->setDateRetrait(new \DateTimeImmutable('2030-06-10 09:00:00'))
            ->setDateRestitution(new \DateTimeImmutable('2030-06-10 18:00:00'))
            ->setStatut('Validée');
        $reservation->addLigne(
            (new ReservationMaterielLigne())
                ->setMateriel($equipment)
                ->setQuantite(4),
        );

        return $reservation;
    }
}
