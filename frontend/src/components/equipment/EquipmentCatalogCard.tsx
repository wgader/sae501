'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { buttonVariants } from '@/components/ui/Button';
import { IconCampagne, IconMateriel } from '@/components/ui/icons';
import { Equipment, getMediaUrl } from '@/lib/api';
import { useEquipmentCategories } from '@/hooks/useEquipmentCategories';
import { cn } from '@/lib/utils';
import { routes } from '@/lib/routes';

type EquipmentCatalogCardProps = {
  equipment: Equipment;
  reserveHref?: string;
};

export default function EquipmentCatalogCard({
  equipment,
  reserveHref = routes.equipmentBooking(equipment.id),
}: EquipmentCatalogCardProps) {
  const { labelOf } = useEquipmentCategories();
  const [hasBrokenImage, setHasBrokenImage] = useState(false);
  const imageUrl = getMediaUrl(equipment.imagePath);
  const units = `${equipment.stockTotal} unité${equipment.stockTotal > 1 ? 's' : ''}`;
  const duration = `${equipment.maxConsecutiveDays} jour${equipment.maxConsecutiveDays > 1 ? 's' : ''} max`;

  return (
    <article className="group flex w-full flex-col overflow-hidden rounded-card border border-line bg-white shadow-xs transition-shadow duration-200 hover:shadow-card">
      <div className="relative h-64 shrink-0 overflow-hidden bg-paper">
        {imageUrl && !hasBrokenImage ? (
          <Image
            src={imageUrl}
            alt={`Photo de ${equipment.designation}`}
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setHasBrokenImage(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted/40">
            <IconMateriel className="h-14 w-14" />
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-pill bg-white px-3 py-1 text-caption font-bold uppercase tracking-label text-primary shadow-xs">
          {labelOf(equipment.categorie)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="text-lg font-black leading-tight text-ink">{equipment.designation}</h3>
        {equipment.description && <p className="mt-2 line-clamp-3 text-body-sm text-muted">{equipment.description}</p>}

        <ul className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-5 text-meta font-bold text-ink">
          <li className="flex items-center gap-1.5">
            <IconMateriel className="h-4 w-4 shrink-0 text-primary" />
            {units}
          </li>
          <li className="flex items-center gap-1.5">
            <IconCampagne className="h-4 w-4 shrink-0 text-primary" />
            {duration}
          </li>
        </ul>

        <Link href={reserveHref} className={cn(buttonVariants({ size: 'md' }), 'mt-5 w-full')}>
          Réserver
        </Link>
      </div>
    </article>
  );
}
