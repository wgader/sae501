import Link from 'next/link';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithoutRef } from 'react';
import { type Association } from '@/lib/api';
import StatusTag from './StatusTag';
import { cn } from '@/lib/utils';

export const associationCardVariants = cva(
  'group flex items-center justify-between gap-4 rounded-[1.13rem] border border-[var(--line)] bg-[var(--White)] shadow-xs transition-all duration-200 hover:border-[var(--Mosaic-Tile)]/40 hover:shadow-md',
  {
    variants: {
      compact: {
        true: 'p-4',
        false: 'p-5 sm:p-6',
      },
    },
    defaultVariants: {
      compact: false,
    },
  },
);

export interface AssociationCardDataProps {
  association: Association;
  showModules?: boolean;
}

export interface AssociationCardProps
  extends Omit<ComponentPropsWithoutRef<typeof Link>, 'href'>,
    VariantProps<typeof associationCardVariants> {
  compact?: boolean;
  className?: string;
  href?: string;
  onClick?: () => void;
}

export default function AssociationCard({
  association,
  showModules = false,
  compact = false,
  className,
  href,
  onClick,
  ...props
}: AssociationCardDataProps & AssociationCardProps) {
  const isSubventionActive = Boolean(
    association.moduleSubventionActif || association.permissions?.includes('subventions'),
  );
  const isSalleActive = Boolean(
    association.moduleSalleActif || association.permissions?.includes('salles'),
  );
  const isMaterielActive = Boolean(
    association.moduleMaterielActif || association.permissions?.includes('materiel'),
  );
  const hasAnyModule = isSubventionActive || isSalleActive || isMaterielActive;

  const content = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.94rem] sm:text-[1rem] font-bold uppercase tracking-tight text-[var(--ink)] group-hover:text-[var(--Mosaic-Tile)] transition-colors">
          {association.nom}
        </span>

        <span className="mt-2 flex flex-wrap items-center gap-2.5 sm:gap-3">
          {showModules ? (
            <>
              {isSubventionActive && <StatusTag status="subventions" />}
              {isSalleActive && <StatusTag status="salles" />}
              {isMaterielActive && <StatusTag status="materiel" />}
              {!hasAnyModule && (
                <span className="text-xs text-[var(--muted)]">Aucun module actif</span>
              )}
              {association.contact && (
                <span className="hidden text-xs text-[var(--muted)] sm:inline">
                  · {association.contact.prenom} {association.contact.nom} ({association.contact.email})
                </span>
              )}
            </>
          ) : (
            <>
              <StatusTag status={association.statut} />
              {association.contact && (
                <span className="hidden text-xs text-[var(--muted)] sm:inline">
                  · {association.contact.prenom} {association.contact.nom} ({association.contact.email})
                </span>
              )}
            </>
          )}
        </span>
      </span>

      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--ink)] transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[var(--Mosaic-Tile)]">
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`Consulter le dossier de ${association.nom}`}
        className={cn(
          associationCardVariants({ compact }),
          'w-full cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--Mosaic-Tile)]',
          className,
        )}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={href || `/admin/inscriptions/${association.id}`}
      className={cn(associationCardVariants({ compact }), className)}
      {...props}
    >
      {content}
    </Link>
  );
}

