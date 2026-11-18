import type { ReactNode } from 'react';
import { cva } from 'class-variance-authority';

export const adminTabVariants = cva('cursor-pointer border-b-2 px-1 pb-3 text-body-sm font-bold transition-colors', {
  variants: {
    active: {
      true: 'border-primary text-primary',
      false: 'border-transparent text-muted hover:text-ink',
    },
  },
});

interface AdminSectionTabsProps {
  label: string;
  children: ReactNode;
}

/** Onglets d'une page de gestion, identiques sur les salles et le matériel. */
export default function AdminSectionTabs({ label, children }: AdminSectionTabsProps) {
  return (
    <nav aria-label={label} className="flex gap-6 border-b border-line">
      {children}
    </nav>
  );
}
