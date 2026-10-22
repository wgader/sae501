import Link from 'next/link';
import { type Association } from '@/lib/api';
import StatusBadge from '@/components/ui/StatusBadge';
import { IconChevronLeft } from '@/components/ui/icons';

interface AssociationDetailHeaderProps {
  association: Association;
  formattedDate: string | null;
}

export default function AssociationDetailHeader({
  association,
  formattedDate,
}: AssociationDetailHeaderProps) {
  return (
    <header className="space-y-4">
      <div>
        <Link
          href="/admin/association"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--muted)] transition-colors hover:text-[var(--Mosaic-Tile)]"
        >
          <IconChevronLeft className="h-4 w-4" />
          <span>Retour à l’annuaire</span>
        </Link>
      </div>

      <div className="rounded-[20px] border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-[var(--Mosaic-Tile)]">
            Fiche association #{association.id}
          </span>
          <StatusBadge status={association.statut} size="md" />
        </div>

        <h1 className="mt-3 text-2xl font-black uppercase tracking-tight text-[var(--ink)] sm:text-3xl">
          {association.nom}
        </h1>

        {formattedDate && (
          <p className="mt-2 text-xs text-[var(--muted)]">
            Enregistrée le <strong className="font-semibold text-[var(--ink)]">{formattedDate}</strong>
          </p>
        )}
      </div>
    </header>
  );
}
