import type { ReactNode } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

type Tone = 'light' | 'dark';

const eyebrowVariants = cva('text-label font-bold uppercase tracking-eyebrow', {
  variants: { tone: { light: 'text-primary', dark: 'text-accent' } },
});
const titleVariants = cva('mt-4 font-display text-4xl leading-heading font-normal tracking-display text-balance sm:text-5xl', {
  variants: { tone: { light: 'text-ink', dark: 'text-white' } },
});
const copyVariants = cva('mt-5 text-body-lg leading-copy text-pretty', {
  variants: { tone: { light: 'text-muted', dark: 'text-white/75' } },
});

interface SectionHeadingProps {
  id: string;
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
  tone?: Tone;
  align?: 'start' | 'center';
  className?: string;
}

/** Surtitre, titre éditorial et introduction d'une section de la page d'accueil. */
export default function SectionHeading({ id, eyebrow, title, children, tone = 'light', align = 'start', className }: SectionHeadingProps) {
  return (
    <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center', className)}>
      <p className={eyebrowVariants({ tone })}>{eyebrow}</p>
      <h2 id={id} className={titleVariants({ tone })}>{title}</h2>
      {children && <p className={copyVariants({ tone })}>{children}</p>}
    </div>
  );
}
