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
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted transition-colors hover:text-primary"
        >
          <IconChevronLeft className="h-4 w-4" />
          <span>Retour à l’annuaire</span>
        </Link>
      </div>

      <div className="rounded-card border border-line bg-paper p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-label font-bold uppercase tracking-kicker text-primary">
            Fiche association #{association.id}
          </span>
          <StatusBadge status={association.statut} size="md" />
        </div>

        <h1 className="mt-3 text-2xl font-black uppercase tracking-tight text-ink sm:text-3xl">
          {association.nom}
        </h1>

        {formattedDate && (
          <p className="mt-2 text-xs text-muted">
            Enregistrée le <strong className="font-semibold text-ink">{formattedDate}</strong>
          </p>
        )}
      </div>
    </header>
  );
}
