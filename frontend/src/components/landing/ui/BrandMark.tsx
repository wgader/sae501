import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface BrandMarkProps {
  tone?: 'light' | 'dark';
  className?: string;
}

/** Logo de la ville accolé au nom du service, sur fond clair ou sombre. */
export default function BrandMark({ tone = 'light', className }: BrandMarkProps) {
  const isDark = tone === 'dark';

  return (
    <Link href="/" aria-label="Accueil de l’espace associations de Feytiat" className={cn('inline-flex items-center gap-3.5 transition-opacity hover:opacity-85', className)}>
      <Image
        src={isDark ? '/assets/logo-feytiat-white.svg' : '/assets/logo-feytiat.svg'}
        alt=""
        width={160}
        height={33}
        priority
        className="h-7 w-auto sm:h-8"
      />
      <span className={cn('hidden border-l pl-3.5 text-label leading-tight font-bold uppercase tracking-label sm:block', isDark ? 'border-white/25 text-white/80' : 'border-line text-muted')}>
        Espace
        <br />
        associations
      </span>
    </Link>
  );
}
