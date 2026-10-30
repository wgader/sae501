'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Equipment, getMediaUrl } from '@/lib/api';

type EquipmentDetailVisualProps = {
  equipment: Equipment;
};

export default function EquipmentDetailVisual({ equipment }: EquipmentDetailVisualProps) {
  const [hasBrokenImage, setHasBrokenImage] = useState(false);
  const imageUrl = getMediaUrl(equipment.imagePath);

  return (
    <div className="relative flex min-h-88 items-center justify-center overflow-hidden bg-paper sm:min-h-96">
      {imageUrl && !hasBrokenImage ? (
        <Image
          src={imageUrl}
          alt={`Photo de ${equipment.designation}`}
          fill
          unoptimized
          sizes="(max-width: 1024px) 100vw, 55vw"
          className="object-contain p-8 sm:p-14"
          onError={() => setHasBrokenImage(true)}
        />
      ) : (
        <div
          className="flex flex-col items-center justify-center text-primary"
          role="img"
          aria-label={`Illustration pour ${equipment.designation}`}
        >
          <span className="flex h-24 w-24 items-center justify-center rounded-full border border-primary/20 bg-white/80">
            <svg
              className="h-12 w-12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </span>
          <span className="mt-4 text-xs font-bold uppercase tracking-label">Photo illustrative</span>
        </div>
      )}
    </div>
  );
}
