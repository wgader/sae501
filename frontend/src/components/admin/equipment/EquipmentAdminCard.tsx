'use client';

import Image from 'next/image';
import { cva } from 'class-variance-authority';
import Button from '@/components/ui/Button';
import { IconMateriel } from '@/components/ui/icons';
import { Equipment, getMediaUrl } from '@/lib/api';
import { getEquipmentCategoryLabel } from '@/lib/equipmentCategories';

interface EquipmentAdminCardProps {
  item: Equipment;
  hasBrokenImage: boolean;
  onBrokenImage: (id: number) => void;
  onAdjust: (item: Equipment) => void;
  onEdit: (item: Equipment) => void;
  onArchive: (item: Equipment) => void;
}

const statusVariants = cva('rounded-pill px-3 py-1 text-caption font-bold uppercase tracking-label shadow-xs', {
  variants: {
    archived: {
      true: 'bg-paper text-muted',
      false: 'bg-primary-soft text-primary',
    },
  },
});

const statTermClassName = 'text-label font-bold uppercase tracking-label text-muted';
const statValueClassName = 'mt-1 text-xl font-black text-ink';
const statUnitClassName = 'text-meta font-bold text-muted';

/** Fiche d'un équipement du parc : photo, stock, durée d'emprunt et actions de gestion. */
export default function EquipmentAdminCard({ item, hasBrokenImage, onBrokenImage, onAdjust, onEdit, onArchive }: EquipmentAdminCardProps) {
  const imageUrl = getMediaUrl(item.imagePath);

  return (
    <article className="flex w-full flex-col overflow-hidden rounded-card border border-line bg-white shadow-card">
      <div className="relative h-56 shrink-0 bg-paper">
        {imageUrl && !hasBrokenImage ? (
          <Image
            src={imageUrl}
            alt={`Photo de ${item.designation}`}
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover"
            onError={() => onBrokenImage(item.id)}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted/40">
            <IconMateriel className="h-14 w-14" />
          </div>
        )}
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <span className="rounded-pill bg-white px-3 py-1 text-caption font-bold uppercase tracking-label text-primary shadow-xs">
            {getEquipmentCategoryLabel(item.categorie)}
          </span>
          <span className={statusVariants({ archived: item.isArchived })}>{item.statut}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        {item.referenceInterne && <p className="text-meta text-muted">Réf. {item.referenceInterne}</p>}
        <h3 className="mt-1 text-lg font-black leading-tight text-ink">{item.designation}</h3>
        {item.description && <p className="mt-2 line-clamp-2 text-body-sm text-muted">{item.description}</p>}

        <dl className="mt-auto grid grid-cols-2 gap-3 pt-5">
          <div className="rounded-soft bg-paper px-4 py-3">
            <dt className={statTermClassName}>Stock</dt>
            <dd className={statValueClassName}>
              {item.stockTotal} <span className={statUnitClassName}>unité{item.stockTotal > 1 ? 's' : ''}</span>
            </dd>
          </div>
          <div className="rounded-soft bg-paper px-4 py-3">
            <dt className={statTermClassName}>Emprunt max</dt>
            <dd className={statValueClassName}>
              {item.maxConsecutiveDays} <span className={statUnitClassName}>jour{item.maxConsecutiveDays > 1 ? 's' : ''}</span>
            </dd>
          </div>
        </dl>
      </div>

      <footer className="grid grid-cols-3 gap-2 border-t border-line p-4">
        <Button variant="secondary" size="sm" className="px-2" onClick={() => onAdjust(item)}>
          Ajuster
        </Button>
        <Button size="sm" className="px-2" onClick={() => onEdit(item)}>
          Modifier
        </Button>
        <Button variant="danger" size="sm" className="px-2" disabled={item.isArchived} onClick={() => onArchive(item)}>
          {item.isArchived ? 'Archivé' : 'Archiver'}
        </Button>
      </footer>
    </article>
  );
}
