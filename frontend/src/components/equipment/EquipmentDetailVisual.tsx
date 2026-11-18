'use client';

import Image from 'next/image';
import { useState } from 'react';
import { IconMateriel } from '@/components/ui/icons';
import { Equipment, getMediaUrl } from '@/lib/api';

type EquipmentDetailVisualProps = {
  equipment: Equipment;
};

export default function EquipmentDetailVisual({ equipment }: EquipmentDetailVisualProps) {
  const [hasBrokenImage, setHasBrokenImage] = useState(false);
  const imageUrl = getMediaUrl(equipment.imagePath);

  return (
    <div className="relative flex h-56 items-center justify-center overflow-hidden rounded-card bg-paper sm:h-72">
      {imageUrl && !hasBrokenImage ? (
        <Image
          src={imageUrl}
          alt={`Photo de ${equipment.designation}`}
          fill
          unoptimized
          sizes="(max-width: 1024px) 100vw, 80vw"
          className="object-contain p-6"
          onError={() => setHasBrokenImage(true)}
        />
      ) : (
        <IconMateriel className="h-16 w-16 text-muted/40" />
      )}
    </div>
  );
}
