import { type Association } from '@/lib/api';
import StatusBadge from '@/components/ui/StatusBadge';

interface InscriptionHeaderProps {
  association: Association;
  formattedDate: string;
}

export default function InscriptionHeader({
  association,
  formattedDate,
}: InscriptionHeaderProps) {
  return (
    <header className="rounded-[20px] border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-8">
      <span className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-[var(--Mosaic-Tile)]">
          Dossier d’inscription #{association.id}
        </span>

        <StatusBadge status={association.statut} size="md" />
      </span>

      <h1 className="mt-3 text-2xl sm:text-3xl font-black uppercase tracking-tight text-[var(--ink)]">
        {association.nom}
      </h1>

      <p className="mt-2 text-xs text-[var(--muted)]">
        Demande déposée le <strong className="text-[var(--ink)] font-semibold">{formattedDate}</strong>
      </p>
    </header>
  );
}
