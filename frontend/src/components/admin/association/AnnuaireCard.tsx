'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { type Association } from '@/lib/api';
import { getAssociationCardMeta } from '@/lib/associationDirectory';
import {
  IconMembres,
  IconCategorie,
  IconPresidence,
  IconEmail,
  IconTelephone,
  IconInfo,
  IconChevronRight,
} from '@/components/ui/icons';

interface AnnuaireCardProps {
  association: Association;
  index?: number;
}

export default function AnnuaireCard({ association }: AnnuaireCardProps) {
  const [imageError, setImageError] = useState(false);
  const meta = getAssociationCardMeta(association);

  const contact = association.contact;
  const hasPresident = Boolean(contact?.prenom || contact?.nom);
  const presidentName = hasPresident ? `${contact?.prenom ?? ''} ${contact?.nom ?? ''}`.trim() : null;
  const email = contact?.email || null;
  const telephone = contact?.telephone || null;

  const hasContactInfo = Boolean(presidentName || email || telephone);

  return (
    <article className="group relative flex h-full flex-col justify-between overflow-hidden rounded-[20px] border border-[var(--line)] bg-[var(--White)] shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-[var(--Mosaic-Tile)]/40 hover:shadow-md">
      <Link
        href={`/admin/association/${association.id}`}
        className="absolute inset-0 z-10"
        aria-label={`Consulter la fiche de ${association.nom}`}
      >
        <span className="sr-only">Voir les détails de {association.nom}</span>
      </Link>

      <figure className="relative flex h-56 w-full items-center justify-center overflow-hidden bg-[var(--Pale-Sage)] sm:h-64">
        {!imageError && meta.imageUrl ? (
          <Image
            src={meta.imageUrl}
            alt={`Photo de l'association ${association.nom}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 33vw"
            unoptimized
            onError={() => setImageError(true)}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span
            className="flex h-full w-full items-center justify-center bg-[var(--Pale-Sage)] text-[var(--Mosaic-Tile)]"
            role="img"
            aria-label={`Illustration pour ${association.nom}`}
          >
            <span className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[var(--Mosaic-Tile)]/30 bg-[var(--White)]/50 shadow-xs transition-transform duration-300 group-hover:scale-110">
              <IconMembres className="h-10 w-10 text-[var(--Mosaic-Tile)]" />
            </span>
          </span>
        )}
        <figcaption className="sr-only">{association.nom}</figcaption>
      </figure>

      <section className="flex flex-1 flex-col justify-between p-5">
        <header className="mb-3">
          <h3 className="line-clamp-2 text-base font-bold uppercase tracking-tight text-[var(--ink)] transition-colors group-hover:text-[var(--Mosaic-Tile)] sm:text-[1.0625rem]">
            {association.nom}
          </h3>
        </header>

        <ul className="m-0 list-none space-y-2.5 p-0 text-xs sm:text-sm text-[var(--ink)]">
          <li className="flex items-center gap-2.5">
            <IconMembres className="h-4 w-4 shrink-0 text-[var(--Mosaic-Tile)]" />
            <span>
              <strong className="font-semibold">Membres : </strong>
              <span className="text-[var(--ink)]">{meta.membersText}</span>
            </span>
          </li>

          <li className="flex items-center gap-2.5">
            <IconCategorie className="h-4 w-4 shrink-0 text-[var(--Mosaic-Tile)]" />
            <span>
              <strong className="font-semibold">Catégorie : </strong>
              <span className="text-[var(--ink)]">{meta.category}</span>
            </span>
          </li>

          {hasContactInfo ? (
            <>
              {presidentName && (
                <li className="flex items-center gap-2.5">
                  <IconPresidence className="h-4 w-4 shrink-0 text-[var(--Mosaic-Tile)]" />
                  <span>
                    <strong className="font-semibold">Présidence : </strong>
                    <span className="text-[var(--ink)]">{presidentName}</span>
                  </span>
                </li>
              )}

              {email && (
                <li className="flex items-center gap-2.5">
                  <IconEmail className="h-4 w-4 shrink-0 text-[var(--Mosaic-Tile)]" />
                  <span className="truncate">
                    <strong className="font-semibold">E-mail : </strong>
                    <a
                      href={`mailto:${email}`}
                      className="relative z-20 text-[var(--ink)] transition-colors hover:text-[var(--Mosaic-Tile)] hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {email}
                    </a>
                  </span>
                </li>
              )}

              {telephone && (
                <li className="flex items-center gap-2.5">
                  <IconTelephone className="h-4 w-4 shrink-0 text-[var(--Mosaic-Tile)]" />
                  <span>
                    <strong className="font-semibold">Téléphone : </strong>
                    <a
                      href={`tel:${telephone}`}
                      className="relative z-20 text-[var(--ink)] transition-colors hover:text-[var(--Mosaic-Tile)] hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {telephone}
                    </a>
                  </span>
                </li>
              )}
            </>
          ) : (
            <li className="flex items-center gap-2.5">
              <IconInfo className="h-4 w-4 shrink-0 text-[var(--Mosaic-Tile)]" />
              <span>
                <strong className="font-semibold">Coordonnées : </strong>
                <span className="text-[var(--muted)]">Non renseigné</span>
              </span>
            </li>
          )}
        </ul>

        <footer className="mt-3.5 flex items-center justify-end">
          <span className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--Mosaic-Tile)] transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[var(--Mosaic-Tile)]">
            <IconChevronRight className="h-5 w-5" />
          </span>
        </footer>
      </section>
    </article>
  );
}
