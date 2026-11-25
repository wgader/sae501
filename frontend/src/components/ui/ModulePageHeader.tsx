import type { ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const headerVariants = cva('relative overflow-hidden rounded-card px-6 py-7 sm:px-9 sm:py-9', {
  variants: {
    module: {
      grants: 'bg-module-grants text-ink',
      rooms: 'bg-module-rooms text-ink',
      equipment: 'bg-module-equipment text-white',
      events: 'bg-module-events text-ink',
    },
  },
});

const ringVariants = cva(
  'pointer-events-none absolute -right-16 -top-16 size-64 rounded-full border-ring',
  {
    variants: {
      module: { grants: 'border-white/45', rooms: 'border-white/40', equipment: 'border-white/10', events: 'border-white/55' },
    },
  },
);

const leadVariants = cva('mt-3 max-w-2xl text-body leading-copy', {
  variants: {
    module: { grants: 'text-ink/75', rooms: 'text-ink/75', equipment: 'text-white/85', events: 'text-ink/75' },
  },
});

const stepVariants = cva('flex gap-3 rounded-soft p-4', {
  variants: {
    module: { grants: 'bg-white/70', rooms: 'bg-white/60', equipment: 'bg-white/10', events: 'bg-white/70' },
  },
});

const stepNumberVariants = cva('grid size-7 shrink-0 place-items-center rounded-full text-meta font-black', {
  variants: {
    module: {
      grants: 'bg-ink text-white',
      rooms: 'bg-ink text-white',
      equipment: 'bg-white text-indigo',
      events: 'bg-ink text-white',
    },
  },
});

const stepTextVariants = cva('mt-1 text-body-sm leading-normal', {
  variants: {
    module: { grants: 'text-ink/70', rooms: 'text-ink/70', equipment: 'text-white/75', events: 'text-ink/70' },
  },
});

export type ModuleTone = NonNullable<VariantProps<typeof headerVariants>['module']>;

export interface ModuleStep {
  title: string;
  description: string;
}

interface ModulePageHeaderProps {
  module: ModuleTone;
  title: string;
  lead: ReactNode;
  steps: readonly ModuleStep[];
  /** Information propre à la page (date limite, campagne en cours…) affichée sous l'introduction. */
  children?: ReactNode;
  className?: string;
}

/** Bandeau d'une démarche : couleur du module comme sur l'accueil, et les étapes à suivre. */
export default function ModulePageHeader({ module, title, lead, steps, children, className }: ModulePageHeaderProps) {
  return (
    <header className={cn(headerVariants({ module }), className)}>
      <span className={ringVariants({ module })} aria-hidden="true" />

      <div className="relative">
        <h1 className="text-3xl font-black tracking-display sm:text-4xl">{title}</h1>
        <p className={leadVariants({ module })}>{lead}</p>
        {children}

        <h2 className="sr-only">Les étapes de la démarche</h2>
        <ol className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-flow-col lg:auto-cols-fr lg:grid-cols-none">
          {steps.map((step, index) => (
            <li key={step.title} className={stepVariants({ module })}>
              <span className={stepNumberVariants({ module })} aria-hidden="true">
                {index + 1}
              </span>
              <div>
                <p className="text-body-sm font-black">{step.title}</p>
                <p className={stepTextVariants({ module })}>{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </header>
  );
}
