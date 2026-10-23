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
    <article className="overflow-hidden rounded-card border border-line bg-white shadow-xs">
      <figure className="relative flex h-44 w-full items-center justify-center overflow-hidden bg-primary-soft sm:h-52">
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
            className="flex h-full w-full items-center justify-center bg-primary-soft text-primary"
            role="img"
            aria-label={`Illustration pour ${association.nom}`}
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-pill border-2 border-primary/30 bg-white/50 shadow-xs">
              <IconMembres className="h-8 w-8 text-primary" />
            </span>
          </span>
        )}
        <figcaption className="sr-only">{association.nom}</figcaption>
      </figure>

      <section className="p-6 sm:p-7">
        <header className="border-b border-line pb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-ink">
            Identité et présentation
          </h2>
        </header>

        <dl className="mt-5 space-y-4">
          <div>
            <dt className="flex items-center gap-1.5 text-label font-bold uppercase tracking-wider text-muted">
              <IconAssociation className="h-3.5 w-3.5 text-primary" />
              <span>Nom de l’association</span>
            </dt>
            <dd className="mt-1 text-sm font-bold uppercase text-ink">
              {association.nom}
            </dd>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="flex items-center gap-1.5 text-label font-bold uppercase tracking-wider text-muted">
                <IconCategorie className="h-3.5 w-3.5 text-primary" />
                <span>Catégorie d’activité</span>
              </dt>
              <dd className="mt-1 text-sm font-semibold text-ink">
                {categoryText}
              </dd>
            </div>

            <div>
              <dt className="flex items-center gap-1.5 text-label font-bold uppercase tracking-wider text-muted">
                <IconMembres className="h-3.5 w-3.5 text-primary" />
                <span>Nombre d’adhérents</span>
              </dt>
              <dd className="mt-1 text-sm font-semibold text-ink">
                {membersText}
              </dd>
            </div>
          </div>

          <div>
            <dt className="flex items-center gap-1.5 text-label font-bold uppercase tracking-wider text-muted">
              <IconPresentation className="h-3.5 w-3.5 text-primary" />
              <span>Présentation</span>
            </dt>
            <dd className="mt-1 text-sm font-semibold text-ink">
              Non renseigné
            </dd>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="flex items-center gap-1.5 text-label font-bold uppercase tracking-wider text-muted">
                <IconDocument className="h-3.5 w-3.5 text-primary" />
                <span>N° RNA / SIRET</span>
              </dt>
              <dd className="mt-1 text-sm font-semibold text-ink">
                {association.numeroRna || 'Non renseigné'}
              </dd>
            </div>

            <div>
              <dt className="flex items-center gap-1.5 text-label font-bold uppercase tracking-wider text-muted">
                <IconLocation className="h-3.5 w-3.5 text-primary" />
                <span>Adresse du siège</span>
              </dt>
              <dd className="mt-1 text-sm font-semibold text-ink">
                Non renseigné
              </dd>
            </div>
          </div>
        </dl>
      </section>
    </article>
  );
}
