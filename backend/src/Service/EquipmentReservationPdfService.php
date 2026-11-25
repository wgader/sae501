<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\ReservationMateriel;
use Dompdf\Dompdf;
use Dompdf\Options;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Contracts\Cache\CacheInterface;
use Symfony\Contracts\Cache\ItemInterface;
use Twig\Environment;

/**
 * Bon de réservation de matériel en PDF, généré par Dompdf dans le conteneur de l’application
 * (comme le planning des campagnes) : aucun service externe n’est nécessaire.
 */
final class EquipmentReservationPdfService
{
    /** Un bon validé ou clôturé ne change plus : il est gardé en cache une journée. */
    private const CACHEABLE_STATUSES = ['Validée', 'Clôturée'];

    public function __construct(
        private readonly Environment $twig,
        #[Autowire('%app.pdf_logo_path%')]
        private readonly string $logoPath,
        private readonly CacheInterface $pdfCache,
        #[Autowire('%kernel.cache_dir%/dompdf')]
        private readonly string $fontCacheDirectory,
    ) {
    }

    public function generate(ReservationMateriel $reservation, bool $provisional = false): string
    {
        $isCacheable = !$provisional && in_array($reservation->getStatut(), self::CACHEABLE_STATUSES, true);
        if (!$isCacheable) {
            return $this->generatePdf($reservation, $provisional);
        }

        return $this->pdfCache->get(
            $this->cacheKey($reservation),
            function (ItemInterface $item) use ($reservation, $provisional): string {
                $item->expiresAfter(24 * 60 * 60);

                return $this->generatePdf($reservation, $provisional);
            },
        );
    }

    private function generatePdf(ReservationMateriel $reservation, bool $provisional): string
    {
        $logo = @file_get_contents($this->logoPath);
        if (false === $logo) {
            throw new \RuntimeException('Le logo de la mairie est introuvable.');
        }

        $html = $this->twig->render('pdf/equipment_reservation.html.twig', [
            'reservation' => $reservation,
            'association' => $reservation->getAssociation(),
            'associationContact' => $this->associationContact($reservation),
            'provisional' => $provisional,
            // Le logo est intégré au document : Dompdf ne fait aucun accès réseau ni disque.
            'logoDataUri' => 'data:image/svg+xml;base64,'.base64_encode($logo),
            'issuedAt' => new \DateTimeImmutable('now', new \DateTimeZone('Europe/Paris')),
            'municipality' => [
                'name' => 'Mairie de Feytiat',
                'address' => 'Place de Leun, 87220 Feytiat',
                'phone' => '05 55 48 43 00',
                'email' => 'accueil@ville-feytiat.fr',
            ],
        ]);

        if (!is_dir($this->fontCacheDirectory)) {
            mkdir($this->fontCacheDirectory, 0775, true);
        }

        $options = new Options();
        $options->setDefaultFont('DejaVu Sans');
        // Aucun accès réseau ni PHP embarqué : le document ne contient que nos données.
        $options->setIsRemoteEnabled(false);
        $options->setIsPhpEnabled(false);
        $options->setIsJavascriptEnabled(false);
        $options->setFontCache($this->fontCacheDirectory);
        $options->setTempDir(sys_get_temp_dir());

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html, 'UTF-8');
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        return (string) $dompdf->output();
    }

    /**
     * @return array{email: ?string, telephone: ?string}
     */
    private function associationContact(ReservationMateriel $reservation): array
    {
        $contact = $reservation->getAssociation()?->getUsers()->first();

        return [
            'email' => false === $contact ? null : $contact?->getEmail(),
            'telephone' => false === $contact ? null : $contact?->getTelephone(),
        ];
    }

    /** La clé change dès qu’une donnée imprimée change : un bon modifié est régénéré. */
    private function cacheKey(ReservationMateriel $reservation): string
    {
        $association = $reservation->getAssociation();
        $contact = $this->associationContact($reservation);
        $lines = [];

        foreach ($reservation->getLignes() as $line) {
            $equipment = $line->getMateriel();
            $lines[] = [
                'id' => $line->getId(),
                'equipmentId' => $equipment?->getId(),
                'designation' => $equipment?->getDesignation(),
                'reference' => $equipment?->getReferenceInterne(),
                'quantity' => $line->getQuantite(),
            ];
        }

        $fingerprint = [
            'id' => $reservation->getId(),
            'status' => $reservation->getStatut(),
            'associationId' => $association?->getId(),
            'associationName' => $association?->getNom(),
            'associationEmail' => $contact['email'],
            'associationTelephone' => $contact['telephone'],
            'motif' => $reservation->getMotifEvenement(),
            'start' => $reservation->getDateRetrait()?->format('Y-m-d\TH:i:sP'),
            'end' => $reservation->getDateRestitution()?->format('Y-m-d\TH:i:sP'),
            'caution' => $reservation->getCautionMontant(),
            'updatedAt' => $reservation->getUpdatedAt()?->format('Y-m-d\TH:i:s.uP'),
            'lines' => $lines,
        ];

        return 'equipment_reservation_pdf_'
            .$reservation->getId().'_'
            .hash('sha256', json_encode($fingerprint, JSON_THROW_ON_ERROR));
    }
}
