<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Association;
use App\Entity\Campaign;
use App\Entity\CampaignWish;
use App\Entity\CampaignWishSubmission;
use App\Entity\Salle;
use App\Entity\User;
use App\Exception\CampaignWishValidationException;
use App\Exception\RoomBookingClosedException;
use App\Message\SendCampaignWishConfirmationMessage;
use App\Repository\CampaignRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Messenger\MessageBusInterface;

/**
 * Dépôt des vœux récurrents d'une association pendant la campagne annuelle des salles.
 */
final class CampaignWishService
{
    public const MAX_WISHES = 20;
    private const TIME_PATTERN = '/^([01]\d|2[0-3]):[0-5]\d$/';

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly CampaignRepository $campaignRepository,
        private readonly CampaignService $campaignService,
        private readonly MessageBusInterface $messageBus,
        private readonly AppSettingsService $settings,
    ) {
    }

    /**
     * Campagne qui accepte des vœux maintenant, ou exception si aucune n'est ouverte : la date de
     * clôture est revérifiée ici, même si la tâche planifiée n'a pas encore fermé la campagne.
     */
    public function openCampaign(\DateTimeImmutable $now): Campaign
    {
        $this->campaignService->synchronize($now);
        $campaign = $this->campaignRepository->findCurrent($now, 'salle');
        if (null === $campaign || ($campaign->getClosingAt() !== null && $campaign->getClosingAt() < $now)) {
            throw new RoomBookingClosedException('La période de dépôt des vœux est terminée ou n’a pas encore commencé.');
        }

        return $campaign;
    }

    /**
     * @param mixed $lines lignes du formulaire, telles que reçues
     *
     * @throws RoomBookingClosedException      campagne fermée
     * @throws CampaignWishValidationException dossier invalide
     */
    public function submit(Association $association, User $user, mixed $lines): CampaignWishSubmission
    {
        $campaign = $this->openCampaign(new \DateTimeImmutable());

        if (!is_array($lines) || [] === $lines) {
            throw new CampaignWishValidationException([['line' => null, 'field' => null, 'message' => 'Ajoutez au moins un vœu.']]);
        }
        if (count($lines) > self::MAX_WISHES) {
            throw new CampaignWishValidationException([['line' => null, 'field' => null, 'message' => sprintf('Un dossier compte au plus %d vœux.', self::MAX_WISHES)]]);
        }

        $errors = [];
        $wishes = [];
        foreach (array_values($lines) as $index => $line) {
            $wish = $this->buildWish(is_array($line) ? $line : [], $index + 1, $errors);
            if (null !== $wish) {
                foreach ($wishes as $previousIndex => $previous) {
                    if ($wish->overlaps($previous)) {
                        $errors[] = ['line' => $index + 1, 'field' => 'startTime', 'message' => sprintf('Le vœu %d chevauche le vœu %d (même salle, même jour).', $index + 1, $previousIndex + 1)];
                    }
                }
                $wishes[$index] = $wish;
            }
        }
        if ([] !== $errors) {
            throw new CampaignWishValidationException($errors);
        }

        $submission = new CampaignWishSubmission($campaign, $association, $user);
        foreach ($wishes as $wish) {
            $submission->addWish($wish);
        }
        $this->entityManager->persist($submission);
        $this->entityManager->flush();

        $this->messageBus->dispatch(new SendCampaignWishConfirmationMessage((int) $submission->getId()));

        return $submission;
    }

    /**
     * @param array<string, mixed>                                              $line
     * @param list<array{line: int|null, field: string|null, message: string}> $errors
     */
    private function buildWish(array $line, int $number, array &$errors): ?CampaignWish
    {
        $fail = static function (string $field, string $message) use (&$errors, $number): void {
            $errors[] = ['line' => $number, 'field' => $field, 'message' => sprintf('Vœu %d : %s', $number, $message)];
        };
        $before = count($errors);

        $salleId = filter_var($line['salleId'] ?? null, FILTER_VALIDATE_INT);
        $salle = false !== $salleId ? $this->entityManager->find(Salle::class, $salleId) : null;
        if (null === $salle || false === $salle->isActive()) {
            $fail('salleId', 'choisissez une salle disponible.');
        }

        $day = filter_var($line['dayOfWeek'] ?? null, FILTER_VALIDATE_INT);
        if (false === $day || !isset(CampaignWish::DAYS[$day])) {
            $fail('dayOfWeek', 'choisissez un jour de la semaine.');
        }

        $start = $line['startTime'] ?? null;
        $end = $line['endTime'] ?? null;
        $timesValid = is_string($start) && is_string($end)
            && 1 === preg_match(self::TIME_PATTERN, $start) && 1 === preg_match(self::TIME_PATTERN, $end);
        if (!$timesValid) {
            $fail('startTime', 'les horaires doivent être au format HH:mm.');
        } elseif ($end <= $start) {
            $fail('endTime', 'l’heure de fin doit être après l’heure de début.');
        } else {
            $settings = $this->settings->current();
            $opening = $settings->getRoomOpeningHour() * 60;
            $closing = $settings->getRoomClosingHour() * 60;
            if (AppSettingsService::toMinutes($start) < $opening || AppSettingsService::toMinutes($end) > $closing) {
                $fail('startTime', sprintf('les salles sont ouvertes de %dh à %dh.', $settings->getRoomOpeningHour(), $settings->getRoomClosingHour()));
            }
        }

        $frequency = $line['frequency'] ?? null;
        if (!is_string($frequency) || !isset(CampaignWish::FREQUENCIES[$frequency])) {
            $fail('frequency', 'choisissez une fréquence.');
        }

        $activity = is_string($line['activity'] ?? null) ? trim($line['activity']) : '';
        if ('' === $activity || mb_strlen($activity) > 120) {
            $fail('activity', 'décrivez l’activité en 120 caractères au plus.');
        }

        $audience = $line['audience'] ?? null;
        if (!is_string($audience) || !isset(CampaignWish::AUDIENCES[$audience])) {
            $fail('audience', 'choisissez le public concerné.');
        }

        $attendance = filter_var($line['expectedAttendance'] ?? null, FILTER_VALIDATE_INT);
        if (false === $attendance || $attendance < 1) {
            $fail('expectedAttendance', 'indiquez un effectif d’au moins une personne.');
        } elseif (null !== $salle && null !== $salle->getCapaciteMax() && $attendance > $salle->getCapaciteMax()) {
            $fail('expectedAttendance', sprintf('l’effectif dépasse la capacité de la salle (%d personnes).', $salle->getCapaciteMax()));
        }

        if (count($errors) > $before || null === $salle) {
            return null;
        }

        return new CampaignWish($salle, (int) $day, (string) $start, (string) $end, (string) $frequency, $activity, (string) $audience, (int) $attendance);
    }

    /**
     * @return array<string, mixed>
     */
    public static function serializeWish(CampaignWish $wish): array
    {
        return [
            'id' => $wish->getId(),
            'type' => $wish->getType(),
            'status' => $wish->getStatus(),
            'salle' => ['id' => $wish->getSalle()?->getId(), 'nom' => $wish->getSalle()?->getNom()],
            'dayOfWeek' => $wish->getDayOfWeek(),
            'dayLabel' => CampaignWish::DAYS[$wish->getDayOfWeek()] ?? '',
            'startTime' => $wish->getStartTime(),
            'endTime' => $wish->getEndTime(),
            'frequency' => $wish->getFrequency(),
            'frequencyLabel' => CampaignWish::FREQUENCIES[$wish->getFrequency()] ?? $wish->getFrequency(),
            'activity' => $wish->getActivity(),
            'audience' => $wish->getAudience(),
            'audienceLabel' => CampaignWish::AUDIENCES[$wish->getAudience()] ?? $wish->getAudience(),
            'expectedAttendance' => $wish->getExpectedAttendance(),
            'decisionComment' => $wish->getDecisionComment(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function serializeSubmission(CampaignWishSubmission $submission): array
    {
        return [
            'id' => $submission->getId(),
            'submittedAt' => $submission->getSubmittedAt()->format(\DateTimeInterface::ATOM),
            'wishes' => array_map(self::serializeWish(...), $submission->getWishes()->toArray()),
        ];
    }
}
