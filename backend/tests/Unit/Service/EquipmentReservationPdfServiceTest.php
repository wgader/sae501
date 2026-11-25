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
use Twig\Environment;
use Twig\Loader\ArrayLoader;
use Twig\TwigFunction;

final class EquipmentReservationPdfServiceTest extends TestCase
{
    public function testValidatedReservationPdfIsGeneratedOnlyOnce(): void
    {
        $renders = 0;
        $twig = new Environment(new ArrayLoader([
            'pdf/equipment_reservation.html.twig' => '{{ count_render() }}<p>Bon {{ reservation.motifEvenement }}</p>',
        ]));
        $twig->addFunction(new TwigFunction('count_render', static function () use (&$renders): string {
            ++$renders;

            return '';
        }));
        $service = new EquipmentReservationPdfService(
            $twig,
            dirname(__DIR__, 3).'/templates/pdf/logo-feytiat.svg',
            new ArrayAdapter(),
            sys_get_temp_dir().'/dompdf-test-fonts',
        );

        $reservation = $this->createReservation();
        $first = $service->generate($reservation);

        self::assertStringStartsWith('%PDF-', $first);
        self::assertSame($first, $service->generate($reservation));
        self::assertSame(1, $renders);
    }

    public function testProvisionalPdfIsNeverCached(): void
    {
        $renders = 0;
        $twig = new Environment(new ArrayLoader([
            'pdf/equipment_reservation.html.twig' => '{{ count_render() }}<p>Provisoire</p>',
        ]));
        $twig->addFunction(new TwigFunction('count_render', static function () use (&$renders): string {
            ++$renders;

            return '';
        }));
        $service = new EquipmentReservationPdfService(
            $twig,
            dirname(__DIR__, 3).'/templates/pdf/logo-feytiat.svg',
            new ArrayAdapter(),
            sys_get_temp_dir().'/dompdf-test-fonts',
        );

        $reservation = $this->createReservation()->setStatut('En attente');
        $service->generate($reservation, true);
        $service->generate($reservation, true);

        self::assertSame(2, $renders);
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
