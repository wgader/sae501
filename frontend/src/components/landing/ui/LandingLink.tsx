import Link from 'next/link';
import type { ComponentProps } from 'react';
import { buttonVariants } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { VariantProps } from 'class-variance-authority';

type LandingLinkProps = ComponentProps<typeof Link> & VariantProps<typeof buttonVariants>;

/** Lien d'action présenté comme un bouton du design system. */
export default function LandingLink({ variant, size = 'lg', className, ...props }: LandingLinkProps) {
  return <Link className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
