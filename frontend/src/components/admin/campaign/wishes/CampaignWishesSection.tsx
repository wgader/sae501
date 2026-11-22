'use client';

import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { fieldControlVariants } from '@/components/admin/campaign/fieldStyles';
import WishDecisionDialog, { type WishDecision } from '@/components/admin/campaign/wishes/WishDecisionDialog';
import WishSlotGroup from '@/components/admin/campaign/wishes/WishSlotGroup';
import Notice from '@/components/ui/Notice';
import {
  acceptCampaignWish,
  getAdminCampaignWishes,
  refuseCampaignWish,
  resetCampaignWish,
  type AdminCampaignWish,
  type AdminCampaignWishes,
} from '@/lib/api';
import { WISH_DAYS } from '@/lib/campaignWishes';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

type Scope = 'todo' | 'disputed' | 'all';

const SCOPES: ReadonlyArray<{ value: Scope; label: string }> = [
  { value: 'todo', label: 'À arbitrer' },
  { value: 'disputed', label: 'En concurrence' },
  { value: 'all', label: 'Tous' },
];

interface CampaignWishesSectionProps {
  campaignId: number;
  onFeedback: (message: string) => void;
}

/**
 * Arbitrage des vœux récurrents : un accordéon par créneau disputé, quel que soit le nombre
 * d'associations sur le même créneau (la liste défile dans l'accordéon, la page ne s'étire pas).
 */
export default function CampaignWishesSection({ campaignId, onFeedback }: CampaignWishesSectionProps) {
  const titleId = useId();
  const salleId = useId();
  const dayId = useId();
  const [data, setData] = useState<AdminCampaignWishes | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = useState<Scope>('todo');
  const [salle, setSalle] = useState('');
  const [day, setDay] = useState('');
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());
  const [decision, setDecision] = useState<WishDecision | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await getAdminCampaignWishes(campaignId));
      setError(null);
    } catch (err) {
      logger.error('Chargement des vœux impossible', err);
      setError(err instanceof Error ? err.message : 'Impossible de charger les vœux.');
    }
  }, [campaignId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const salles = useMemo(
    () => [...new Map((data?.groups ?? []).map((group) => [group.salle.id, group.salle.nom])).entries()],
    [data],
  );

  const groups = (data?.groups ?? []).filter((group) => {
    const pending = group.wishes.some((wish) => wish.status === 'En attente d’arbitrage par la mairie');
    if (scope === 'todo' && !pending) return false;
    if (scope === 'disputed' && !group.disputed) return false;
    if (salle && String(group.salle.id) !== salle) return false;
    if (day && String(group.dayOfWeek) !== day) return false;
    return true;
  });

  const toggle = (key: string) =>
    setOpenKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const allOpen = groups.length > 0 && groups.every((group) => openKeys.has(group.key));

  const run = async (action: () => Promise<unknown>, message: string) => {
    await action();
    onFeedback(message);
    await load();
  };

  const reset = (wish: AdminCampaignWish) =>
    void run(() => resetCampaignWish(wish.id), `Le vœu de ${wish.association.nom} est de nouveau à arbitrer.`).catch((err) =>
      setError(err instanceof Error ? err.message : 'Impossible de remettre le vœu en attente.'),
    );

  return (
    <section aria-labelledby={titleId} className="space-y-5">
      <div className="flex flex-col gap-2 border-b border-line pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id={titleId} className="text-lg font-black text-ink sm:text-xl">Vœux récurrents</h2>
          <p className="text-body-sm text-muted">Créneaux réguliers demandés pour la saison, regroupés quand ils se disputent la même salle.</p>
        </div>
        {data && (
          <p className="text-meta font-bold text-muted">
            {data.counts.total} vœu{data.counts.total > 1 ? 'x' : ''} · {data.counts.pending} à arbitrer · {data.counts.disputed} créneau
            {data.counts.disputed > 1 ? 'x' : ''} en concurrence
          </p>
        )}
      </div>

      {error && <Notice tone="danger">{error}</Notice>}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Vœux à afficher" className="flex flex-wrap gap-2">
          {SCOPES.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={scope === option.value}
              onClick={() => setScope(option.value)}
              className={`rounded-pill border px-4 py-2 text-meta font-bold transition-colors cursor-pointer ${
                scope === option.value ? 'border-primary bg-primary text-white' : 'border-line bg-white text-ink hover:bg-paper'
              }`}
            >
              {option.label}
            </button>
          ))}
        </nav>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor={salleId} className="sr-only">Salle</label>
          <select id={salleId} value={salle} onChange={(event) => setSalle(event.target.value)} className={cn(fieldControlVariants(), 'mt-0 w-auto py-2')}>
            <option value="">Toutes les salles</option>
            {salles.map(([id, nom]) => <option key={id} value={id}>{nom}</option>)}
          </select>
          <label htmlFor={dayId} className="sr-only">Jour</label>
          <select id={dayId} value={day} onChange={(event) => setDay(event.target.value)} className={cn(fieldControlVariants(), 'mt-0 w-auto py-2')}>
            <option value="">Tous les jours</option>
            {WISH_DAYS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          {groups.length > 0 && (
            <button
              type="button"
              onClick={() => setOpenKeys(allOpen ? new Set() : new Set(groups.map((group) => group.key)))}
              className="px-2 text-meta font-bold uppercase tracking-label text-primary hover:underline cursor-pointer"
            >
              {allOpen ? 'Tout replier' : 'Tout déplier'}
            </button>
          )}
        </div>
      </div>

      {data && groups.length === 0 ? (
        <p className="rounded-card border border-dashed border-line bg-paper px-6 py-10 text-center text-body-sm text-muted">
          {data.counts.total === 0 ? 'Aucun vœu déposé pour cette campagne.' : 'Aucun créneau ne correspond à ces filtres.'}
        </p>
      ) : (
        <ul className="space-y-3">
          {groups.map((group) => (
            <WishSlotGroup
              key={group.key}
              group={group}
              open={openKeys.has(group.key)}
              onToggle={() => toggle(group.key)}
              onAccept={(wish, competitors) => setDecision({ mode: 'accept', wish, competitors })}
              onRefuse={(wish) => setDecision({ mode: 'refuse', wish })}
              onReset={reset}
            />
          ))}
        </ul>
      )}

      <WishDecisionDialog
        decision={decision}
        onClose={() => setDecision(null)}
        onAccept={(wish, refuseOthers) =>
          run(() => acceptCampaignWish(wish.id, refuseOthers), `Créneau attribué à ${wish.association.nom}.`)
        }
        onRefuse={(wish, comment) => run(() => refuseCampaignWish(wish.id, comment), `Vœu de ${wish.association.nom} refusé.`)}
      />
    </section>
  );
}
