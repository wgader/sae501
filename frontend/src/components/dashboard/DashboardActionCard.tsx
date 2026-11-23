import type { ReactNode } from 'react';
import Link from 'next/link';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardVariants = cva(
  'group relative flex h-full min-h-76 flex-col justify-between overflow-hidden rounded-card p-6 shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl active:scale-98',
  {
    variants: {
      module: {
        grants: 'bg-module-grants text-ink',
        rooms: 'bg-module-rooms text-ink',
        equipment: 'bg-module-equipment text-white',
        events: 'bg-module-events text-ink',
      },
    },
  },
);

const ringVariants = cva(
  'pointer-events-none absolute -bottom-8 -right-8 size-32 rounded-full border-14 transition-transform duration-300 group-hover:scale-110',
  {
    variants: {
      module: { grants: 'border-ink/5', rooms: 'border-ink/5', equipment: 'border-white/20', events: 'border-ink/5' },
    },
  },
);

// La flèche reste sombre au repos sur toutes les cartes et ne passe en blanc qu'au survol.
const arrowVariants = cva(
  'grid size-8 place-items-center rounded-full bg-ink text-white transition-all duration-200 group-hover:scale-110 group-hover:bg-white',
  {
    variants: {
      module: {
        grants: 'group-hover:text-ink',
        rooms: 'group-hover:text-ink',
        equipment: 'group-hover:text-indigo',
        events: 'group-hover:text-ink',
      },
    },
  },
);

const softTextVariants = cva('', {
  variants: {
    module: { grants: 'text-ink/70', rooms: 'text-ink/70', equipment: 'text-white/80', events: 'text-ink/70' },
  },
});

export type DashboardModule = NonNullable<VariantProps<typeof cardVariants>['module']>;

export interface DashboardActionCardProps {
  step: string;
  tag: string;
  title: ReactNode;
  description: string;
  href: string;
  module: DashboardModule;
}

export default function DashboardActionCard({ step, tag, title, description, href, module }: DashboardActionCardProps) {
  return (
    <Link href={href} className={cardVariants({ module })}>
      <span className={ringVariants({ module })} aria-hidden="true" />

      <div className="relative z-10">
        <p className={cn('flex items-center justify-between text-label font-bold uppercase tracking-kicker', softTextVariants({ module }))}>
          <span>{tag}</span>
          <span>{step}</span>
        </p>

        <h3 className="mt-6 text-2xl font-black leading-tight tracking-subheading">{title}</h3>

        <p className={cn('mt-3 text-body-sm leading-normal', softTextVariants({ module }))}>{description}</p>
      </div>

      <div className="relative z-10 mt-6 flex items-center justify-between border-t border-current/15 pt-4">
        <span className="text-label font-bold uppercase tracking-kicker">Démarrer</span>
        <span className={arrowVariants({ module })} aria-hidden="true">
          <svg
            className="size-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="M12 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
