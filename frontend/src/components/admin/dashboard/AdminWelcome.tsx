import Link from 'next/link';
import { IconAssociation, IconMateriel, IconSalle } from '@/components/ui/icons';
import { formatToday, workloadSummary } from '@/lib/adminDashboard';
import type { AdminDashboard } from '@/lib/api/types';

interface AdminWelcomeProps {
  firstName: string | null;
  /** Null tant que le navigateur n'a pas fourni l'heure locale. */
  today: Date | null;
  dashboard: AdminDashboard | null;
}

/** Bandeau d'accueil : date du jour, charge de travail et chiffres clés de la commune. */
export default function AdminWelcome({ firstName, today, dashboard }: AdminWelcomeProps) {
  const totals = dashboard
    ? [
        { label: 'associations actives', value: dashboard.totals.associations, icon: IconAssociation, href: '/admin/association' },
        { label: 'salles municipales', value: dashboard.totals.rooms, icon: IconSalle, href: '/admin/salle' },
        { label: 'équipements au catalogue', value: dashboard.totals.equipment, icon: IconMateriel, href: '/admin/materiel' },
      ]
    : [];

  return (
    <section aria-labelledby="admin-welcome-heading" className="relative overflow-hidden rounded-card bg-sage px-6 py-8 sm:px-10 sm:py-9">
      <span className="pointer-events-none absolute -bottom-12 -right-12 size-48 rounded-full border-18 border-white/70" aria-hidden="true" />

      <div className="relative">
        <p className="min-h-4 text-label font-bold uppercase tracking-eyebrow text-ink/70 sm:text-meta">{today ? formatToday(today) : ''}</p>
        <h1 id="admin-welcome-heading" className="mt-3 text-4xl font-black leading-heading tracking-display text-ink sm:text-5xl">
          Bonjour{firstName ? ',' : ''} <span className="text-primary">{firstName ?? ''}</span>
        </h1>
        <p className="mt-3 max-w-2xl text-body leading-copy text-ink/80 sm:text-body-lg" aria-live="polite">
          {dashboard ? workloadSummary(dashboard) : 'Chargement de la journée…'}
        </p>

        {totals.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-2">
            {totals.map(({ label, value, icon: Icon, href }) => (
              <li key={label}>
                <Link
                  href={href}
                  className="inline-flex items-center gap-2 rounded-pill bg-white/80 px-4 py-2 text-body-sm text-ink shadow-2xs transition-colors hover:bg-white"
                >
                  <Icon className="size-4 text-primary" />
                  <strong className="font-black">{value}</strong>
                  <span className="text-ink/70">{label}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
