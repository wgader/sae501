import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionTitleProps {
  id: string;
  title: ReactNode;
  text?: string;
  align?: 'start' | 'center';
  className?: string;
}

/** Titre court et une phrase au plus : la page se lit d'un coup d'œil. */
export default function SectionTitle({ id, title, text, align = 'start', className }: SectionTitleProps) {
  return (
    <div className={cn('max-w-xl', align === 'center' && 'mx-auto text-center', className)}>
      <h2 id={id} className="text-4xl font-black tracking-heading text-balance text-ink sm:text-5xl">
        {title}
      </h2>
      {text && <p className="mt-4 text-body-lg leading-copy text-muted">{text}</p>}
    </div>
  );
}
