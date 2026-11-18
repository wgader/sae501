'use client';

import EquipmentAdminCard from '@/components/admin/equipment/EquipmentAdminCard';
import Notice from '@/components/ui/Notice';
import type { Equipment } from '@/lib/api';

interface EquipmentInventoryProps {
  items: Equipment[];
  loading: boolean;
  error: string | null;
  brokenImageIds: number[];
  onBrokenImage: (id: number) => void;
  onAdjust: (item: Equipment) => void;
  onEdit: (item: Equipment) => void;
  onArchive: (item: Equipment) => void;
}

export default function EquipmentInventory({ items, loading, error, brokenImageIds, onBrokenImage, onAdjust, onEdit, onArchive }: EquipmentInventoryProps) {
  if (loading) {
    return (
      <p role="status" className="py-16 text-center text-body-sm text-muted">
        Chargement de l’inventaire…
      </p>
    );
  }
  if (error) return <Notice tone="danger">{error}</Notice>;
  if (items.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-line px-6 py-12 text-center text-body-sm text-muted">
        Aucun équipement ne correspond à ces filtres.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <li key={item.id} className="flex">
          <EquipmentAdminCard
            item={item}
            hasBrokenImage={brokenImageIds.includes(item.id)}
            onBrokenImage={onBrokenImage}
            onAdjust={onAdjust}
            onEdit={onEdit}
            onArchive={onArchive}
          />
        </li>
      ))}
    </ul>
  );
}
