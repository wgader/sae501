'use client';

import { useId } from 'react';
import { cva } from 'class-variance-authority';
import Button from '@/components/ui/Button';
import { IconChevronRight, IconWarning } from '@/components/ui/icons';
import WishStatusBadge from '@/components/campaign/wishes/WishStatusBadge';
import type { AdminCampaignWish, AdminCampaignWishGroup } from '@/lib/api';
import { cn } from '@/lib/utils';

const groupVariants = cva('overflow-hidden rounded-card border bg-white transition-shadow', {
  variants: {
    state: {
      disputed: 'border-danger/40',
      settled: 'border-primary/30',
      single: 'border-line',
    },
    open: { true: 'shadow-card', false: '' },
  },
});

const countVariants = cva('inline-flex shrink-0 items-center gap-1.5 rounded-pill px-3 py-1 text-meta font-bold', {
  variants: {
    state: {
      disputed: 'bg-danger/10 text-danger',
      settled: 'bg-primary-soft text-primary',
      single: 'bg-paper text-muted',
    },
  },
});

interface WishSlotGroupProps {
  group: AdminCampaignWishGroup;
  open: boolean;
  onToggle: () => void;
  onAccept: (wish: AdminCampaignWish, competitors: number) => void;
  onRefuse: (wish: AdminCampaignWish) => void;
  onReset: (wish: AdminCampaignWish) => void;
}

/**
 * Un créneau et tous les vœux qui le demandent, en accordéon : fermé, il résume la situation
 * (« 10 vœux en concurrence », ou l'association retenue) ; ouvert, il liste les candidats.
 * Au-delà de quelques vœux, la liste défile dans l'accordéon au lieu d'allonger la page.
 */
export default function WishSlotGroup({ group, open, onToggle, onAccept, onRefuse, onReset }: WishSlotGroupProps) {
  const panelId = useId();
  const winner = group.wishes.find((wish) => wish.status === 'Attribué');
  const pending = group.wishes.filter((wish) => wish.status === 'En attente d’arbitrage par la mairie');
  const state = winner ? 'settled' : group.disputed ? 'disputed' : 'single';
  const summary = winner
    ? `Attribué à ${winner.association.nom}`
    : group.disputed
      ? `${group.wishes.length} vœux en concurrence`
      : '1 vœu';

  return (
    <li className={groupVariants({ state, open })}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex w-full cursor-pointer flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 text-left transition-colors hover:bg-paper/60 sm:flex-nowrap"
      >
        <IconChevronRight className={cn('h-4 w-4 shrink-0 text-muted transition-transform duration-200', open && 'rotate-90')} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-body font-black text-ink">{group.salle.nom}</span>
          <span className="block text-body-sm text-muted">
            {group.dayLabel} · {group.startTime} – {group.endTime}
          </span>
        </span>
        <span className={countVariants({ state })}>
          {state === 'disputed' && <IconWarning className="h-3.5 w-3.5" />}
          {summary}
        </span>
        {pending.length > 0 && group.disputed && !winner && (
          <span className="hidden text-meta text-muted sm:inline">{pending.length} à arbitrer</span>
        )}
      </button>

      {open && (
        <div id={panelId} className="border-t border-line">
          <ul className="max-h-planning-viewport divide-y divide-line overflow-y-auto custom-scrollbar">
            {group.wishes.map((wish) => {
              const isPending = wish.status === 'En attente d’arbitrage par la mairie';
              const overCapacity = group.salle.capaciteMax !== null && wish.expectedAttendance > group.salle.capaciteMax;
              return (
                <li key={wish.id} className="grid gap-3 px-5 py-4 md:grid-cols-12 md:items-center">
                  <div className="min-w-0 md:col-span-5">
                    <p className="truncate text-body-sm font-black text-ink">{wish.association.nom}</p>
                    <p className="truncate text-meta text-muted">{wish.activity}</p>
                  </div>
                  <div className="text-meta text-ink md:col-span-3">
                    <p>{wish.startTime} – {wish.endTime} · {wish.frequency === 'weekly' ? 'chaque semaine' : 'une semaine sur deux'}</p>
                    <p className={overCapacity ? 'font-bold text-danger' : 'text-muted'}>
                      {wish.audienceLabel} · {wish.expectedAttendance} pers.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:col-span-4 md:justify-end">
                    {isPending ? (
                      <>
                        <Button size="sm" variant="secondary" onClick={() => onRefuse(wish)}>Refuser</Button>
                        <Button size="sm" disabled={Boolean(winner)} onClick={() => onAccept(wish, pending.length - 1)}>Attribuer</Button>
                      </>
                    ) : (
                      <>
                        <WishStatusBadge status={wish.status} />
                        <button type="button" onClick={() => onReset(wish)} className="text-meta font-bold text-muted underline-offset-4 hover:text-ink hover:underline cursor-pointer">
                          Remettre en attente
                        </button>
                      </>
                    )}
                  </div>
                  {wish.decisionComment && wish.status === 'Refusé' && (
                    <p className="text-meta text-muted md:col-span-12">Motif : {wish.decisionComment}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </li>
  );
}
