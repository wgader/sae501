'use client';

import Image from 'next/image';
import { useState } from 'react';
import { PublicRoom, getMediaUrl } from '@/lib/api';

interface RoomCardProps {
  room: PublicRoom;
  isSelected: boolean;
  onSelect: (room: PublicRoom) => void;
}

export default function RoomCard({ room, isSelected, onSelect }: RoomCardProps) {
  const [hasBrokenImage, setHasBrokenImage] = useState(false);
  const imageUrl = getMediaUrl(room.imageUrl);

  return (
    <article
      onClick={() => onSelect(room)}
      className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border bg-white transition-all hover:shadow-md ${
        isSelected
          ? 'border-primary ring-2 ring-primary ring-offset-1'
          : 'border-line hover:border-primary/50'
      }`}
    >
      <div className="relative h-44 w-full bg-paper sm:h-48">
        {imageUrl && !hasBrokenImage ? (
          <Image
            src={imageUrl}
            alt={room.nom}
            fill
            unoptimized
            onError={() => setHasBrokenImage(true)}
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-paper text-muted">
            <svg
              className="h-12 w-12 text-muted/60"
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

        <div className="absolute top-3 right-3 flex flex-wrap gap-1.5">
          {room.accesPmr && (
            <span
              className="inline-flex items-center rounded-md bg-white/95 px-2 py-0.5 text-caption font-bold text-ink shadow-xs backdrop-blur-xs"
              title="Accès PMR disponible"
            >
              ♿ PMR
            </span>
          )}
          <span className="inline-flex items-center rounded-md bg-primary px-2.5 py-0.5 text-caption font-bold text-white shadow-xs">
            {room.capaciteMax} pers. max
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-black tracking-tight text-ink group-hover:text-primary">
            {room.nom}
          </h3>
          {isSelected && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-caption font-bold text-primary">
              Sélectionnée
            </span>
          )}
        </div>

        <p className="mt-1 text-xs text-muted">
          📍 {room.adresse}
        </p>

        {room.description && (
          <p className="mt-2 line-clamp-2 text-sm text-ink/80">
            {room.description}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-line/60 pt-3 text-caption text-muted">
          <span className="font-semibold text-ink">Horaires :</span>
          <span>{room.horairesOuverture?.debut ?? '08:00'} — {room.horairesOuverture?.fin ?? '23:00'}</span>
        </div>

        {room.equipementsInclus && room.equipementsInclus.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {room.equipementsInclus.slice(0, 3).map((eq, idx) => (
              <span
                key={idx}
                className="rounded-xs bg-paper px-1.5 py-0.5 text-caption text-muted"
              >
                {eq}
              </span>
            ))}
            {room.equipementsInclus.length > 3 && (
              <span className="rounded-xs bg-paper px-1.5 py-0.5 text-caption text-muted">
                +{room.equipementsInclus.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="mt-4 pt-2">
          <button
            type="button"
            className={`w-full rounded-md py-2.5 text-center text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              isSelected
                ? 'bg-primary text-white shadow-xs hover:bg-primary-hover'
                : 'border border-line bg-white text-ink hover:border-primary hover:bg-primary-soft'
            }`}
          >
            {isSelected ? 'Salle choisie' : 'Choisir cette salle'}
          </button>
        </div>
      </div>
    </article>
  );
}
