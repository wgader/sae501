'use client';

import Image from 'next/image';
import { useState } from 'react';
import { PublicRoom, getMediaUrl } from '@/lib/api';

interface RoomCatalogCardProps {
  room: PublicRoom;
  isAvailable: boolean;
  unavailableReason?: string;
  onReserve: (room: PublicRoom) => void;
}

export default function RoomCatalogCard({
  room,
  isAvailable,
  unavailableReason,
  onReserve,
}: RoomCatalogCardProps) {
  const [hasBrokenImage, setHasBrokenImage] = useState(false);
  const imageUrl = getMediaUrl(room.imageUrl);

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-line bg-white shadow-xs transition-all duration-200 hover:shadow-md">
      {/* Photo */}
      <div className="relative h-48 w-full bg-paper overflow-hidden">
        {imageUrl && !hasBrokenImage ? (
          <Image
            src={imageUrl}
            alt={room.nom}
            fill
            unoptimized
            onError={() => setHasBrokenImage(true)}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-paper text-muted">
            <svg
              className="h-12 w-12 text-muted/50"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d="M3 21h18" />
              <path d="M5 21V7l7-4 7 4v14" />
              <path d="M9 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
              <path d="M15 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
            </svg>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {!isAvailable && (
            <span className="rounded-md bg-amber-500/90 px-2.5 py-0.5 text-caption font-bold uppercase text-white shadow-xs backdrop-blur-xs">
              Indisponible
            </span>
          )}
          <span className="rounded-md bg-black/60 px-2 py-0.5 text-caption font-bold text-white shadow-xs backdrop-blur-xs">
            {room.capaciteMax} pers.
          </span>
        </div>
      </div>

      {/* Info & CTA */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <h3 className="text-base font-black uppercase tracking-tight text-ink group-hover:text-primary">
            {room.nom}
          </h3>
          <p className="mt-1 text-xs text-muted flex items-center gap-1">
            <span>📍</span> {room.adresse}
          </p>
        </div>

        <div className="mt-5">
          {isAvailable ? (
            <button
              type="button"
              onClick={() => onReserve(room)}
              className="w-full rounded-lg bg-primary py-2.5 text-center text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-colors hover:bg-primary-hover cursor-pointer"
            >
              Réserver →
            </button>
          ) : (
            <button
              type="button"
              disabled
              title={unavailableReason || 'Créneau déjà réservé'}
              className="w-full rounded-lg bg-line/60 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-muted cursor-not-allowed"
            >
              Créneau occupé
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

