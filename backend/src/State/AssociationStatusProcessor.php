<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Association;
use App\Service\AssociationStatusNotifier;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

class AssociationStatusProcessor implements ProcessorInterface
{
    public function __construct(
        #[Autowire(service: 'api_platform.doctrine.orm.state.persist_processor')]
        private ProcessorInterface $persistProcessor,
        private AssociationStatusNotifier $statusNotifier,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        // Association à notifier : définie uniquement si son statut change.
        $associationToNotify = null;
        $previousStatus = null;
        $newStatus = null;

        if ($data instanceof Association) {
            $previousData = $context['previous_data'] ?? null;
            if ($previousData instanceof Association) {
                $previousStatus = $previousData->getStatut();
                $newStatus = $data->getStatut();
                if ($previousStatus !== $newStatus) {
                    $associationToNotify = $data;
                }
            }
        }

        // Call the inner processor (PersistProcessor)
        $result = $this->persistProcessor->process($data, $operation, $uriVariables, $context);

        // Send email if status changed to VALIDATED or REFUSED
        if ($associationToNotify !== null && $newStatus !== null) {
            $this->statusNotifier->notify($associationToNotify, $newStatus);
        }

        return $result;
    }
}
