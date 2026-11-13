import type { HTMLAttributes } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';

export const requestTabBadgeVariants = cva(
  'inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-pill px-1.5 text-caption font-black transition-colors',
  {
    variants: {
      isSelected: {
        true: 'bg-white/20 text-white',
        false: 'bg-paper text-muted border border-line',
      },
    },
    defaultVariants: {
      isSelected: false,
    },
  },
);

export interface RequestStatusTabsProps extends HTMLAttributes<HTMLElement> {
  activeTab: string;
  onTabChange: (tab: 'all' | 'active' | 'closed') => void;
  counts: {
    all: number;
    active: number;
    closed: number;
  };
}

export default function RequestStatusTabs({
  activeTab,
  onTabChange,
  counts,
  className,
  ...props
}: RequestStatusTabsProps) {
  const tabs: Array<{ id: 'all' | 'active' | 'closed'; label: string; count: number }> = [
    { id: 'all', label: 'Toutes les démarches', count: counts.all },
    { id: 'active', label: 'Requêtes actives', count: counts.active },
    { id: 'closed', label: 'Dossiers clôturés', count: counts.closed },
  ];

  return (
    <nav
      aria-label="Filtrer par état de traitement"
      className={cn('flex flex-wrap items-center gap-2', className)}
      {...props}
    >
      {tabs.map((tab) => {
        const isSelected = activeTab === tab.id;
        return (
          <Button
            key={tab.id}
            type="button"
            variant={isSelected ? 'primary' : 'secondary'}
            size="sm"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onTabChange(tab.id)}
            className="gap-2 py-2.5 text-xs tracking-label"
          >
            <span>{tab.label}</span>
            <span className={requestTabBadgeVariants({ isSelected })}>
              {tab.count}
            </span>
          </Button>
        );
      })}
    </nav>
  );
}
