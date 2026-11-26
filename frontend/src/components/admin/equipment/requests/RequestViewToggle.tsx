import type { ReactNode } from 'react';
import { cva } from 'class-variance-authority';

export type RequestView = 'list' | 'cards';

const optionVariants = cva('flex cursor-pointer items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-bold transition-colors', {
  variants: {
    selected: {
      true: 'bg-ink text-white',
      false: 'text-muted hover:text-ink',
    },
  },
});

const OPTIONS: { value: RequestView; label: string; icon: ReactNode }[] = [
  {
    value: 'list',
    label: 'Liste',
    icon: (
      <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden="true">
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
      </svg>
    ),
  },
  {
    value: 'cards',
    label: 'Cartes',
    icon: (
      <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
];

interface RequestViewToggleProps {
  value: RequestView;
  onChange: (view: RequestView) => void;
}

/** Bascule entre la liste compacte et les cartes avec photos. */
export default function RequestViewToggle({ value, onChange }: RequestViewToggleProps) {
  return (
    <div role="group" aria-label="Affichage des demandes" className="inline-flex rounded-pill border border-line bg-white p-1">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={optionVariants({ selected: value === option.value })}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}
