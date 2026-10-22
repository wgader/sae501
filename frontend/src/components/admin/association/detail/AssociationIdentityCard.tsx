'use client';

import { useState } from 'react';
import Image from 'next/image';
import { type Association } from '@/lib/api';
import {
  IconMembres,
  IconCategorie,
  IconAssociation,
  IconDocument,
  IconLocation,
  IconPresentation,
} from '@/components/ui/icons';

interface AssociationIdentityCardProps {
  association: Association;
}

export default function AssociationIdentityCard({ association }: AssociationIdentityCardProps) {
  const [imageError, setImageError] = useState(false);

  const membersText =
    typeof association.nombreMembres === 'number' && association.nombreMembres > 0
      ? `${association.nombreMembres} membres`
      : 'Non renseigné';

  const categoryText = association.categorie || 'Non renseigné';

  return (
    <article className="overflow-hidden rounded-[14px] border border-[var(--line)] bg-[var(--White)] shadow-xs">
      <figure className="relative flex h-44 w-full items-center justify-center overflow-hidden bg-[var(--Pale-Sage)] sm:h-52">
        {!imageError && association.imageUrl ? (
          <Image
            src={association.imageUrl}
            alt={`Photo de l'association ${association.nom}`}
            fill
            sizes="(max-width: 1024px) 100vw, 60vw"
            unoptimized
            onError={() => setImageError(true)}
            className="object-cover"
          />
        ) : (
          <span
            className="flex h-full w-full items-center justify-center bg-[var(--Pale-Sage)] text-[var(--Mosaic-Tile)]"
            role="img"
            aria-label={`Illustration pour ${association.nom}`}
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[var(--Mosaic-Tile)]/30 bg-[var(--White)]/50 shadow-xs">
              <IconMembres className="h-8 w-8 text-[var(--Mosaic-Tile)]" />
            </span>
          </span>
        )}
        <figcaption className="sr-only">{association.nom}</figcaption>
      </figure>

      <section className="p-6 sm:p-7">
        <header className="border-b border-[var(--line)] pb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
            Identité et présentation
          </h2>
        </header>

        <dl className="mt-5 space-y-4">
          <div>
            <dt className="flex items-center gap-1.5 text-[0.6875rem] font-bold uppercase tracking-wider text-[var(--muted)]">
              <IconAssociation className="h-3.5 w-3.5 text-[var(--Mosaic-Tile)]" />
              <span>Nom de l’association</span>
            </dt>
            <dd className="mt-1 text-sm font-bold uppercase text-[var(--ink)]">
              {association.nom}
            </dd>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="flex items-center gap-1.5 text-[0.6875rem] font-bold uppercase tracking-wider text-[var(--muted)]">
                <IconCategorie className="h-3.5 w-3.5 text-[var(--Mosaic-Tile)]" />
                <span>Catégorie d’activité</span>
              </dt>
              <dd className="mt-1 text-sm font-semibold text-[var(--ink)]">
                {categoryText}
              </dd>
            </div>

            <div>
              <dt className="flex items-center gap-1.5 text-[0.6875rem] font-bold uppercase tracking-wider text-[var(--muted)]">
                <IconMembres className="h-3.5 w-3.5 text-[var(--Mosaic-Tile)]" />
                <span>Nombre d’adhérents</span>
              </dt>
              <dd className="mt-1 text-sm font-semibold text-[var(--ink)]">
                {membersText}
              </dd>
            </div>
          </div>

          <div>
            <dt className="flex items-center gap-1.5 text-[0.6875rem] font-bold uppercase tracking-wider text-[var(--muted)]">
              <IconPresentation className="h-3.5 w-3.5 text-[var(--Mosaic-Tile)]" />
              <span>Présentation</span>
            </dt>
            <dd className="mt-1 text-sm font-semibold text-[var(--ink)]">
              Non renseigné
            </dd>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="flex items-center gap-1.5 text-[0.6875rem] font-bold uppercase tracking-wider text-[var(--muted)]">
                <IconDocument className="h-3.5 w-3.5 text-[var(--Mosaic-Tile)]" />
                <span>N° RNA / SIRET</span>
              </dt>
              <dd className="mt-1 text-sm font-semibold text-[var(--ink)]">
                {association.numeroRna || 'Non renseigné'}
              </dd>
            </div>

            <div>
              <dt className="flex items-center gap-1.5 text-[0.6875rem] font-bold uppercase tracking-wider text-[var(--muted)]">
                <IconLocation className="h-3.5 w-3.5 text-[var(--Mosaic-Tile)]" />
                <span>Adresse du siège</span>
              </dt>
              <dd className="mt-1 text-sm font-semibold text-[var(--ink)]">
                Non renseigné
              </dd>
            </div>
          </div>
        </dl>
      </section>
    </article>
  );
}
