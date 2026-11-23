import Link from 'next/link';
import { IconCheck } from '@/components/ui/icons';
import { relativeDays } from '@/lib/adminDashboard';
import type { AdminDashboard } from '@/lib/api/types';
import { routes } from '@/lib/routes';

interface LatestRegistrationsProps {
  registrations: AdminDashboard['latestRegistrations'];
  now: Date;
}

function initials(name: string): string {
  return name
    .replace(/^association\s+/i, '')
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('') || name.slice(0, 2).toUpperCase();
}

/** Dernières associations inscrites qui attendent la validation de la mairie. */
export default function LatestRegistrations({ registrations, now }: LatestRegistrationsProps) {
  if (registrations.length === 0) {
    return (
      <p className="flex items-center gap-3 rounded-soft bg-paper p-4 text-body-sm text-muted">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
          <IconCheck />
        </span>
        Aucune inscription en attente.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {registrations.map((registration) => {
        const since = relativeDays(registration.createdAt, now);
        return (
          <li key={registration.id}>
            <Link
              href={routes.adminRegistration(registration.id)}
              className="group flex items-center gap-3 rounded-soft border border-line p-3 transition-colors hover:border-primary/40 hover:bg-paper"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-meta font-black text-primary" aria-hidden="true">
                {initials(registration.nom)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body-sm font-bold text-ink group-hover:text-primary">{registration.nom}</span>
                <span className="block truncate text-meta text-muted">
                  {[registration.contact, since && `inscrite ${since}`].filter(Boolean).join(' · ')}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
