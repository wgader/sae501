'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Equipment, getMediaUrl } from '@/lib/api';
import { buttonVariants } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

type EquipmentCatalogCardProps = {
  equipment: Equipment;
  reserveHref?: string;
};

function EquipmentPlaceholder({ designation }: { designation: string }) {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center bg-primary-soft text-primary"
      role="img"
      aria-label={`Illustration pour ${designation}`}
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-pill border-2 border-primary/20 bg-white/70 shadow-xs transition-transform duration-300 ">
        <svg
          className="h-8 w-8 text-primary"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      </span>
      <span className="mt-2 text-xs font-semibold text-primary/80">Photo illustrative</span>
    </div>
  );
}

export default function EquipmentCatalogCard({
  equipment,
  reserveHref = `/materiel/${equipment.id}`,
}: EquipmentCatalogCardProps) {
  const [hasBrokenImage, setHasBrokenImage] = useState(false);
  const imageUrl = getMediaUrl(equipment.imagePath);

  return (
    <article className="group flex min-h-48 flex-col overflow-hidden border border-line bg-white transition-all duration-200 sm:flex-row">
      <div className="relative h-48 shrink-0 overflow-hidden bg-primary-soft sm:h-auto sm:w-2/5">
          {imageUrl && !hasBrokenImage ? (
            <Image
              src={imageUrl}
              alt={`Photo de ${equipment.designation}`}
              fill
              unoptimized
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover transition-transform duration-300"
              onError={() => setHasBrokenImage(true)}
            />
          ) : (
            <EquipmentPlaceholder designation={equipment.designation} />
          )}

          <span className="absolute bottom-3 left-2 right-2 rounded-pill bg-accent px-2 py-1 text-center text-caption font-bold text-ink shadow-2xs">
            {equipment.stockTotal} unités disponibles
          </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between p-5 sm:p-6">
        <div>
          <p className="text-caption font-bold uppercase tracking-section text-primary">
            {equipment.categorie}
          </p>
          <h3 className="mt-3 text-lg font-bold leading-tight text-ink transition-colors">
            {equipment.designation}
          </h3>
          {equipment.description && (
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted">
              {equipment.description}
            </p>
          )}
        </div>
        <Link
          href={reserveHref}
          className={cn(buttonVariants({ size: 'sm' }), 'mt-4 w-full')}
        >
          <span>Réserver</span>
        </Link>
      </div>
    </article>
  );
}
