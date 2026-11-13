<?php

declare(strict_types=1);

namespace App\Command;

use App\Service\CampaignService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(
    name: 'app:campaigns:synchronize',
    description: 'Synchronise les statuts des campagnes selon leurs dates.',
)]
final class SynchronizeCampaignsCommand extends Command
{
    public function __construct(private readonly CampaignService $campaignService)
    {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $updated = $this->campaignService->synchronize(new \DateTimeImmutable());
        $output->writeln(sprintf('%d campagne(s) synchronisée(s).', count($updated)));

        return Command::SUCCESS;
    }
}
