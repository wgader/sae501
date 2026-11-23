'use client';

import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cva } from 'class-variance-authority';

export interface SettingsTab {
  id: string;
  label: string;
  description: string;
  module: 'rooms' | 'equipment';
  panel: ReactNode;
}

const tabVariants = cva(
  'flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-soft px-4 py-3 text-left transition-colors sm:flex-none',
  {
    variants: {
      selected: {
        true: 'bg-white shadow-xs',
        false: 'text-muted hover:bg-white/60 hover:text-ink',
      },
    },
  },
);

const dotVariants = cva('size-3 shrink-0 rounded-full', {
  variants: {
    module: { rooms: 'bg-module-rooms ring-1 ring-ink/10', equipment: 'bg-module-equipment' },
  },
});

interface SettingsTabsProps {
  tabs: SettingsTab[];
  selected: string;
  onSelect: (id: string) => void;
}

/** Onglets des réglages : flèches gauche et droite pour passer d'un module à l'autre. */
export default function SettingsTabs({ tabs, selected, onSelect }: SettingsTabsProps) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const current = tabs.find((tab) => tab.id === selected) ?? tabs[0];

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const next = tabs[(index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
    onSelect(next.id);
    refs.current[next.id]?.focus();
  };

  return (
    <div className="space-y-6">
      <div role="tablist" aria-label="Modules" className="flex gap-1 rounded-card bg-paper p-1.5 sm:inline-flex">
        {tabs.map((tab, index) => {
          const isSelected = tab.id === current.id;
          return (
            <button
              key={tab.id}
              ref={(node) => {
                refs.current[tab.id] = node;
              }}
              type="button"
              role="tab"
              id={`settings-tab-${tab.id}`}
              aria-selected={isSelected}
              aria-controls={`settings-panel-${tab.id}`}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => onSelect(tab.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={tabVariants({ selected: isSelected })}
            >
              <span className={dotVariants({ module: tab.module })} aria-hidden="true" />
              <span className="min-w-0">
                <span className="block text-body-sm font-black text-ink">{tab.label}</span>
                <span className="hidden text-meta text-muted sm:block">{tab.description}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id={`settings-panel-${current.id}`} aria-labelledby={`settings-tab-${current.id}`} className="space-y-6">
        {current.panel}
      </div>
    </div>
  );
}
