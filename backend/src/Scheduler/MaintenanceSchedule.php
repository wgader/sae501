<?php

declare(strict_types=1);

namespace App\Scheduler;

use Symfony\Component\Console\Messenger\RunCommandMessage;
use Symfony\Component\Scheduler\Attribute\AsSchedule;
use Symfony\Component\Scheduler\RecurringMessage;
use Symfony\Component\Scheduler\Schedule;
use Symfony\Component\Scheduler\ScheduleProviderInterface;
use Symfony\Contracts\Cache\CacheInterface;

/**
 * Tâches récurrentes, exécutées par le worker Messenger (transport scheduler_default).
 */
#[AsSchedule]
final class MaintenanceSchedule implements ScheduleProviderInterface
{
    public function __construct(private readonly CacheInterface $cache)
    {
    }

    public function getSchedule(): Schedule
    {
        return (new Schedule())
            // Ouvre et ferme les campagnes de réservation de salles à leurs dates.
            ->add(RecurringMessage::every('1 minute', new RunCommandMessage('app:campaigns:synchronize')))
            // Supprime du cache les jetons révoqués déjà expirés.
            ->add(RecurringMessage::every('1 hour', new RunCommandMessage('cache:pool:prune')))
            // Après un redémarrage, une tâche manquée n'est rejouée qu'une fois.
            ->stateful($this->cache)
            ->processOnlyLastMissedRun(true);
    }
}
