import Link from 'next/link';
import { IconArrowRight, IconCampagne } from '@/components/ui/icons';
import { formatShortDate, plural } from '@/lib/adminDashboard';
import type { AdminDashboard } from '@/lib/api/types';

/** État de la campagne de salles : ouverte (vœux à arbitrer) ou programmée. */
export default function CampaignStatusCard({ campaign }: { campaign: AdminDashboard['campaign'] }) {
  if (!campaign) {
    return (
      <Link
        href="/admin/campagnes"
        className="group flex items-center gap-3 rounded-card border border-dashed border-line p-5 text-body-sm text-muted transition-colors hover:border-primary/40 hover:text-ink"
      >
        <IconCampagne className="size-5 shrink-0 text-primary" />
        <span className="flex-1">Aucune campagne de salles en cours. Préparez la prochaine saison.</span>
        <IconArrowRight className="transition-transform group-hover:translate-x-1" />
      </Link>
    );
  }

  const active = campaign.status === 'ACTIVE';
  const date = formatShortDate(active ? campaign.closingAt : campaign.openingAt);

  return (
    <Link
      href="/admin/campagnes"
      className="group relative block overflow-hidden rounded-card bg-module-rooms p-5 text-ink transition-all duration-300 hover:-translate-y-1 hover:shadow-card"
    >
      <span className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full border-12 border-ink/5" aria-hidden="true" />
      <p className="relative flex items-center gap-2 text-label font-bold uppercase tracking-kicker text-ink/70">
        <span className={active ? 'size-2 animate-pulse rounded-full bg-primary' : 'size-2 rounded-full bg-ink/30'} aria-hidden="true" />
        {active ? 'Campagne ouverte' : 'Campagne programmée'}
      </p>
      <p className="relative mt-2 text-xl font-black tracking-subheading">{campaign.seasonLabel ?? 'Campagne de salles'}</p>
      <p className="relative mt-1 text-body-sm text-ink/70">
        {active
          ? `${campaign.pendingWishes} ${plural(campaign.pendingWishes, ['vœu à arbitrer', 'vœux à arbitrer'])}${date ? ` · clôture le ${date}` : ''}`
          : `Ouverture aux associations le ${date ?? 'date à définir'}`}
      </p>
    </Link>
  );
}
