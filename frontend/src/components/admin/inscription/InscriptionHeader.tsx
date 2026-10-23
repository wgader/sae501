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
    <header className="rounded-card border border-line bg-paper p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-label font-bold uppercase tracking-kicker text-primary">
          Dossier d’inscription #{association.id}
        </span>

        <StatusBadge status={association.statut} size="md" />
      </div>

      <h1 className="mt-3 text-2xl sm:text-3xl font-black uppercase tracking-tight text-ink">
        {association.nom}
      </h1>

      <p className="mt-2 text-xs text-muted">
        Demande déposée le <strong className="text-ink font-semibold">{formattedDate}</strong>
      </p>
    </header>
  );
}
