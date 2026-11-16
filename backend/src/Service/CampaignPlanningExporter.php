<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Campaign;
use App\Entity\ReservationSalle;
use Dompdf\Dompdf;
use Dompdf\Options;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Twig\Environment;

/**
 * Export PDF du planning des demandes de salle d’une campagne, pour préparer la réunion
 * d’arbitrage avec les associations : planning général, puis par salle et par association.
 */
final class CampaignPlanningExporter
{
    public const VIEW_FULL = 'complet';
    public const VIEW_GENERAL = 'general';
    public const VIEW_ROOM = 'salle';
    public const VIEW_ASSOCIATION = 'association';
    public const VIEWS = [self::VIEW_FULL, self::VIEW_GENERAL, self::VIEW_ROOM, self::VIEW_ASSOCIATION];

    private const STATUS_LABELS = [
        'pending' => 'En attente',
        'accepted' => 'Acceptée',
        'refused' => 'Refusée',
    ];

    public function __construct(
        private readonly CampaignRequestService $requestService,
        private readonly Environment $twig,
        #[Autowire('%kernel.cache_dir%/dompdf')]
        private readonly string $fontCacheDirectory,
    ) {
    }

    /**
     * Période facultative (jours inclus, heures locales) : sans période, toute la campagne est exportée.
     */
    public function export(
        Campaign $campaign,
        ?\DateTimeImmutable $from,
        ?\DateTimeImmutable $to,
        string $view = self::VIEW_FULL,
        bool $includeRefused = false,
    ): string {
        return $this->render($this->html($campaign, $from, $to, $view, $includeRefused));
    }

    /**
     * Document HTML converti en PDF par export().
     */
    public function html(
        Campaign $campaign,
        ?\DateTimeImmutable $from,
        ?\DateTimeImmutable $to,
        string $view = self::VIEW_FULL,
        bool $includeRefused = false,
    ): string {
        if (!\in_array($view, self::VIEWS, true)) {
            throw new \InvalidArgumentException('Vue de planning inconnue.');
        }
        if (null !== $from && null !== $to && $from > $to) {
            throw new \InvalidArgumentException('La date de début de période doit précéder la date de fin.');
        }

        $rows = $this->buildRows($campaign, $from, $to, $includeRefused);

        return $this->twig->render('pdf/campaign_planning.html.twig', [
            'campaign' => $campaign,
            'periodLabel' => $this->periodLabel($rows, $from, $to),
            'generatedAt' => $this->format(new \DateTimeImmutable('now', new \DateTimeZone('Europe/Paris')), "dd/MM/y 'à' HH:mm"),
            'includeRefused' => $includeRefused,
            'summary' => $this->summary($rows),
            'showGeneral' => \in_array($view, [self::VIEW_FULL, self::VIEW_GENERAL], true),
            'showRooms' => \in_array($view, [self::VIEW_FULL, self::VIEW_ROOM], true),
            'showAssociations' => \in_array($view, [self::VIEW_FULL, self::VIEW_ASSOCIATION], true),
            'days' => $this->groupBy($rows, 'dayKey', 'day'),
            'rooms' => $this->groupBy($this->sortedBy($rows, 'salle'), 'salle', 'salle'),
            'associations' => $this->groupBy($this->sortedBy($rows, 'association'), 'association', 'association'),
        ]);
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function buildRows(Campaign $campaign, ?\DateTimeImmutable $from, ?\DateTimeImmutable $to, bool $includeRefused): array
    {
        $requests = $this->requestService->listRequests($campaign);
        $names = [];
        foreach ($requests as $request) {
            $names[(int) $request->getId()] = (string) $request->getAssociation()?->getNom();
        }

        $fromKey = $from?->format('Y-m-d');
        $toKey = $to?->format('Y-m-d');
        $rows = [];
        foreach ($requests as $request) {
            $status = CampaignRequestService::statusKey($request->getStatut());
            $start = $request->getDateDebut();
            $end = $request->getDateFin();
            if ('closed' === $status || ('refused' === $status && !$includeRefused) || null === $start || null === $end) {
                continue;
            }

            $dayKey = $start->format('Y-m-d');
            if ((null !== $fromKey && $dayKey < $fromKey) || (null !== $toKey && $dayKey > $toKey)) {
                continue;
            }

            // Les chevauchements se calculent sur toute la campagne, même hors de la période exportée.
            $conflicts = array_map(
                static fn (int $id): string => $names[$id] ?? '',
                CampaignRequestService::overlappingIds($request, $requests),
            );

            $rows[] = [
                'dayKey' => $dayKey,
                'day' => ucfirst($this->format($start, 'EEEE d MMMM y')),
                'shortDay' => $this->format($start, 'EEE d MMM y'),
                'hours' => $start->format('H:i').' – '.$end->format('H:i'),
                'salle' => (string) $request->getSalle()?->getNom(),
                'capacity' => $request->getSalle()?->getCapaciteMax(),
                'association' => (string) $request->getAssociation()?->getNom(),
                'motif' => (string) $request->getMotifEvenement(),
                'attendees' => $request->getCapaciteAttendue(),
                'status' => $status,
                'statusLabel' => self::STATUS_LABELS[$status] ?? $request->getStatut(),
                'comment' => $request->getDecisionComment(),
                'conflicts' => array_values(array_unique(array_filter($conflicts))),
            ];
        }

        return $rows;
    }

    /**
     * @param list<array<string, mixed>> $rows
     *
     * @return list<array<string, mixed>>
     */
    private function sortedBy(array $rows, string $field): array
    {
        usort($rows, static fn (array $a, array $b): int => [mb_strtolower($a[$field]), $a['dayKey'], $a['hours']]
            <=> [mb_strtolower($b[$field]), $b['dayKey'], $b['hours']]);

        return $rows;
    }

    /**
     * @param list<array<string, mixed>> $rows
     *
     * @return list<array{label: string, rows: list<array<string, mixed>>}>
     */
    private function groupBy(array $rows, string $key, string $labelField): array
    {
        $groups = [];
        foreach ($rows as $row) {
            $groups[$row[$key]] ??= ['label' => $row[$labelField], 'rows' => []];
            $groups[$row[$key]]['rows'][] = $row;
        }

        return array_values($groups);
    }

    /**
     * @param list<array<string, mixed>> $rows
     *
     * @return array<string, int>
     */
    private function summary(array $rows): array
    {
        $summary = ['total' => \count($rows), 'pending' => 0, 'accepted' => 0, 'refused' => 0, 'conflicts' => 0];
        foreach ($rows as $row) {
            ++$summary[$row['status']];
            if ([] !== $row['conflicts']) {
                ++$summary['conflicts'];
            }
        }

        return $summary;
    }

    /**
     * @param list<array<string, mixed>> $rows
     */
    private function periodLabel(array $rows, ?\DateTimeImmutable $from, ?\DateTimeImmutable $to): string
    {
        if (null !== $from || null !== $to) {
            return match (true) {
                null === $to => 'À partir du '.$this->format($from, 'd MMMM y'),
                null === $from => 'Jusqu’au '.$this->format($to, 'd MMMM y'),
                default => 'Du '.$this->format($from, 'd MMMM y').' au '.$this->format($to, 'd MMMM y'),
            };
        }
        if ([] === $rows) {
            return 'Toute la campagne';
        }

        $days = array_column($rows, 'dayKey');

        return \sprintf(
            'Toute la campagne (créneaux du %s au %s)',
            $this->format(new \DateTimeImmutable(min($days)), 'd MMMM y'),
            $this->format(new \DateTimeImmutable(max($days)), 'd MMMM y'),
        );
    }

    private function format(?\DateTimeImmutable $date, string $pattern): string
    {
        if (null === $date) {
            return '';
        }

        // Les créneaux sont des heures locales sans fuseau : on formate dans le fuseau de la date.
        $formatter = new \IntlDateFormatter('fr_FR', \IntlDateFormatter::NONE, \IntlDateFormatter::NONE, $date->getTimezone(), null, $pattern);

        return (string) $formatter->format($date);
    }

    private function render(string $html): string
    {
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
        $dompdf->setPaper('A4', 'landscape');
        $dompdf->render();

        $canvas = $dompdf->getCanvas();
        $font = $dompdf->getFontMetrics()->getFont('DejaVu Sans');
        $canvas->page_text($canvas->get_width() - 110, $canvas->get_height() - 28, 'Page {PAGE_NUM} / {PAGE_COUNT}', $font, 8, [0.43, 0.45, 0.43]);

        return (string) $dompdf->output();
    }
}
