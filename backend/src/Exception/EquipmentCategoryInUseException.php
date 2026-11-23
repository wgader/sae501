<?php

declare(strict_types=1);

namespace App\Exception;

final class EquipmentCategoryInUseException extends \RuntimeException
{
    public function __construct(public readonly int $equipmentCount)
    {
        parent::__construct(sprintf(
            '%d équipement%s utilise%s encore cette catégorie : reclassez-%s avant de la supprimer.',
            $equipmentCount,
            $equipmentCount > 1 ? 's' : '',
            $equipmentCount > 1 ? 'nt' : '',
            $equipmentCount > 1 ? 'les' : 'le',
        ));
    }
}
