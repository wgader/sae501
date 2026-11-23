<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\ReservationMateriel;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Mime\Part\DataPart;
use Symfony\Component\Mime\Part\Multipart\FormDataPart;
use Symfony\Contracts\HttpClient\Exception\TransportExceptionInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;
use Symfony\Contracts\Cache\CacheInterface;
use Symfony\Contracts\Cache\ItemInterface;
use Twig\Environment;

final class EquipmentReservationPdfService
{
    private const GOTENBERG_ENDPOINT = '/forms/chromium/convert/html';

    public function __construct(
        private readonly Environment $twig,
        #[Autowire('%app.gotenberg_url%')]
        private readonly string $gotenbergUrl,
        #[Autowire('%app.pdf_logo_path%')]
        private readonly string $logoPath,
        private readonly HttpClientInterface $httpClient,
        private readonly CacheInterface $pdfCache,
    ) {
    }

    public function generate(ReservationMateriel $reservation, bool $provisional = false): string
    {
        $isCacheable = !$provisional && in_array($reservation->getStatut(), ['Validée', 'Clôturée'], true);
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
        $logo = file_get_contents($this->logoPath);
        if (false === $logo) {
            throw new \RuntimeException('Le logo de la mairie est introuvable.');
        }

        $html = $this->twig->render('pdf/equipment_reservation.html.twig', [
            'reservation' => $reservation,
            'association' => $reservation->getAssociation(),
            'associationContact' => $this->associationContact($reservation),
            'provisional' => $provisional,
            'issuedAt' => new \DateTimeImmutable('now', new \DateTimeZone('Europe/Paris')),
            'municipality' => [
                'name' => 'Mairie de Feytiat',
                'address' => 'Place de Leun, 87220 Feytiat',
                'phone' => '05 55 48 43 00',
                'email' => 'accueil@ville-feytiat.fr',
            ],
        ]);

        $formData = new FormDataPart([
            ['files' => new DataPart($html, 'index.html', 'text/html')],
            ['files' => new DataPart($logo, 'logo-feytiat.svg', 'image/svg+xml')],
        ]);

        try {
            $response = $this->httpClient->request('POST', rtrim($this->gotenbergUrl, '/').self::GOTENBERG_ENDPOINT, [
                'headers' => $formData->getPreparedHeaders()->toArray(),
                'body' => $formData->bodyToIterable(),
                'timeout' => 30,
            ]);
            $statusCode = $response->getStatusCode();
            if (200 !== $statusCode) {
                throw new \RuntimeException(sprintf('Gotenberg returned HTTP status %d.', $statusCode));
            }

            return $response->getContent();
        } catch (TransportExceptionInterface $exception) {
            throw new \RuntimeException('The PDF generation service is unavailable.', 0, $exception);
        }
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

    private function cacheKey(ReservationMateriel $reservation): string
    {
        $association = $reservation->getAssociation();
        $contact = $association?->getUsers()->first();
        $contactEmail = false === $contact ? null : $contact?->getEmail();
        $contactTelephone = false === $contact ? null : $contact?->getTelephone();
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
            'associationEmail' => $contactEmail,
            'associationTelephone' => $contactTelephone,
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
