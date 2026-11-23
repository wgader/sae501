import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Largeur et marges communes à toutes les sections de la page d'accueil. */
export default function LandingContainer({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-340 px-4 sm:px-8 lg:px-12', className)}>{children}</div>;
}
