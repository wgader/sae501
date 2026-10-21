'use client';

export type TabStatus = 'PENDING_VALIDATION' | 'VALIDATED' | 'REFUSED';

interface TabCounts {
  pending: number;
  validated: number;
  refused: number;
}

interface InscriptionStatusTabsProps {
  activeTab: TabStatus;
  onTabChange: (tab: TabStatus) => void;
  counts: TabCounts | null;
}

const TABS: { label: string; value: TabStatus; countKey: keyof TabCounts }[] = [
  { label: 'EN ATTENTE', value: 'PENDING_VALIDATION', countKey: 'pending' },
  { label: 'ACCEPTÉ', value: 'VALIDATED', countKey: 'validated' },
  { label: 'REFUSÉ', value: 'REFUSED', countKey: 'refused' },
];

export default function InscriptionStatusTabs({
  activeTab,
  onTabChange,
  counts,
}: InscriptionStatusTabsProps) {
  return (
    <nav aria-label="Filtres de statut des inscriptions" className="mt-5 flex flex-wrap items-center gap-3">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.value;
        const countValue = counts ? counts[tab.countKey] : null;

        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onTabChange(tab.value)}
            className={`inline-flex items-center gap-2.5 rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              isActive
                ? 'bg-[var(--Mosaic-Tile)] text-[var(--White)] shadow-xs'
                : 'border border-[var(--Mosaic-Tile)] bg-transparent text-[var(--Mosaic-Tile)] hover:bg-[var(--Mosaic-Tile)]/5'
            }`}
          >
            <span>{tab.label}</span>
            {countValue !== null && (
              <span
                className={`inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[0.6875rem] font-bold ${
                  isActive
                    ? 'bg-[var(--Lime-Cream)] text-[var(--ink)]'
                    : 'bg-[var(--Mosaic-Tile)]/15 text-[var(--Mosaic-Tile)]'
                }`}
              >
                {countValue}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
