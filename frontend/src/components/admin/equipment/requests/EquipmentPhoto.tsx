'use client';

import { useState } from 'react';
import Image from 'next/image';
import { IconMateriel } from '@/components/ui/icons';
import { getMediaUrl } from '@/lib/api';

interface EquipmentPhotoProps {
  path: string | null | undefined;
  alt: string;
  sizes: string;
  /** Taille de l’icône affichée quand il n’y a pas de photo. */
  fallbackIconClassName?: string;
}

/** Photo d’un équipement qui remplit son conteneur ; icône de matériel si elle manque ou ne charge pas. */
export default function EquipmentPhoto({ path, alt, sizes, fallbackIconClassName = 'size-5' }: EquipmentPhotoProps) {
  const [isBroken, setIsBroken] = useState(false);
  const url = getMediaUrl(path);

  if (!url || isBroken) {
    return (
      <span className="flex size-full items-center justify-center bg-paper text-muted/50">
        <IconMateriel className={fallbackIconClassName} aria-hidden="true" />
      </span>
    );
  }

  return <Image src={url} alt={alt} fill unoptimized sizes={sizes} className="object-cover" onError={() => setIsBroken(true)} />;
}
