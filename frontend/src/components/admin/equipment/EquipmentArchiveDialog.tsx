'use client';

import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import type { Equipment } from '@/lib/api';

interface EquipmentArchiveDialogProps {
  item: Equipment | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function EquipmentArchiveDialog({ item, onCancel, onConfirm }: EquipmentArchiveDialogProps) {
  return (
    <Dialog
      open={item !== null}
      size="sm"
      title="Archiver cet équipement ?"
      onClose={onCancel}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            Annuler
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Archiver
          </Button>
        </>
      }
    >
      <p className="text-body-sm text-ink">
        « {item?.designation} » ne sera plus proposé aux associations. Il reste conservé dans les dossiers passés.
      </p>
    </Dialog>
  );
}
