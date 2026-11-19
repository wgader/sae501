'use client';

import type { AdminGrantFilter, AdminGrantList } from '@/lib/api';

interface GrantStatusTabsProps {
  active: AdminGrantFilter;
  counts: AdminGrantList['counts'];
  onChange: (filter: AdminGrantFilter) => void;
}

const TABS: ReadonlyArray<{ value: AdminGrantFilter; label: string }> = [
  { value: 'pending', label: 'En attente' },
  { value: 'validated', label: 'Validées' },
  { value: 'refused', label: 'Refusées' },
];

export default function GrantStatusTabs({ active, counts, onChange }: GrantStatusTabsProps) {
  return (
    <nav className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Filtrer les demandes de subvention">
      {TABS.map((tab) => {
        const isActive = active === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.value)}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-pill border px-4 py-2 text-meta font-bold transition-colors ${
              isActive ? 'border-primary bg-primary text-white' : 'border-line bg-white text-ink hover:bg-paper'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`rounded-pill px-2 py-0.5 text-caption ${isActive ? 'bg-white/20 text-white' : 'bg-paper text-muted'}`}>
              {counts[tab.value]}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
