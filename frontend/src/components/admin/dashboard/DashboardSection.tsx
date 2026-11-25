import type { ReactNode } from 'react';
import Link from 'next/link';
import { IconArrowRight } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

interface DashboardSectionProps {
  id: string;
  eyebrow: string;
  title: string;
  link?: { href: string; label: string };
  children: ReactNode;
  className?: string;
}

/** Bloc de l'accueil : surtitre, titre, lien vers la page complète et contenu. */
export default function DashboardSection({ id, eyebrow, title, link, children, className }: DashboardSectionProps) {
  return (
    <section aria-labelledby={id} className={cn('rounded-card border border-line bg-white p-5 sm:p-6', className)}>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-label font-bold uppercase tracking-eyebrow text-muted">{eyebrow}</p>
          <h2 id={id} className="mt-1 text-xl font-black tracking-subheading text-ink">
            {title}
          </h2>
        </div>
        {link && (
          <Link
            href={link.href}
            className="group inline-flex items-center gap-1.5 text-label font-bold uppercase tracking-label text-primary hover:text-primary-hover"
          >
            {link.label}
            <IconArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        )}
      </header>
      {children}
    </section>
  );
}
