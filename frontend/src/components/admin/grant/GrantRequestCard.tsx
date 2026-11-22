import Link from 'next/link';
import GrantStatusBadge from '@/components/subventions/GrantStatusBadge';
import { IconChevronRight, IconSubvention } from '@/components/ui/icons';
import type { AdminGrantSummary } from '@/lib/api';
import { formatGrantAmount, formatGrantDate } from '@/lib/grantApplication';
import { routes } from '@/lib/routes';

export default function GrantRequestCard({ grant }: { grant: AdminGrantSummary }) {
  const date = formatGrantDate(grant.updatedAt ?? grant.createdAt);

  return (
    <li>
      <Link
        href={routes.adminGrant(grant.id)}
        className="group flex items-center gap-4 rounded-card border border-line bg-white p-5 shadow-xs transition hover:border-primary/40 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:p-6"
      >
        <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-soft bg-Misty-Rose text-ink sm:flex">
          <IconSubvention className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-base font-bold uppercase tracking-tight text-ink group-hover:text-primary">
            {grant.association.nom || 'Association non renseignée'}
          </span>
          <span className="mt-1 block truncate text-body-sm text-ink">{grant.intituleProjet}</span>
          <span className="mt-2 flex flex-wrap items-center gap-2.5 text-xs text-muted">
            <GrantStatusBadge status={grant.statut} />
            <span>{grant.typeSubvention} · {formatGrantAmount(grant.montantDemande)} demandés</span>
            {date && <span>· {date}</span>}
          </span>
        </span>
        <IconChevronRight className="h-5 w-5 shrink-0 text-muted transition-transform group-hover:translate-x-1 group-hover:text-primary" />
      </Link>
    </li>
  );
}
