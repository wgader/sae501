'use client';

import { useSyncExternalStore } from 'react';
import Image from 'next/image';
import { cva, type VariantProps } from 'class-variance-authority';
import { getMediaUrl } from '@/lib/api/client';
import { readSession, subscribeSession } from '@/lib/session';

const avatarVariants = cva('relative flex shrink-0 items-center justify-center overflow-hidden rounded-pill bg-accent font-black text-ink', {
  variants: {
    size: {
      sm: 'h-7 w-7 text-caption',
      md: 'h-8 w-8 text-xs',
    },
  },
  defaultVariants: { size: 'sm' },
});

interface AssociationAvatarProps extends VariantProps<typeof avatarVariants> {
  initials: string;
}

/** Photo de profil de l'association connectée, ou ses initiales. */
export default function AssociationAvatar({ initials, size }: AssociationAvatarProps) {
  const logoUrl = useSyncExternalStore(
    subscribeSession,
    () => readSession()?.user.logoUrl ?? null,
    () => null,
  );
  const imageUrl = getMediaUrl(logoUrl);

  return (
    <span className={avatarVariants({ size })}>
      {imageUrl ? <Image src={imageUrl} alt="" fill unoptimized sizes="2rem" className="object-cover" /> : initials}
    </span>
  );
}
