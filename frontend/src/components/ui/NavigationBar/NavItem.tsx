import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { ReactNode } from 'react';

export const navItemVariants = cva(
  'group flex min-h-[2.75rem] w-full items-center justify-center gap-3.5 rounded-control px-0 text-sm font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:justify-start md:px-3.5',
  {
    variants: {
      selected: {
        true: 'bg-primary text-white shadow-xs font-bold [&_svg]:text-white',
        false: 'text-ink hover:bg-sage/40 hover:text-primary [&_svg]:text-primary',
      },
    },
    defaultVariants: {
      selected: false,
    },
  },
);

export interface NavItemDataProps {
  root: string;
  name: string;
  icon: ReactNode;
}

export interface NavItemProps
  extends VariantProps<typeof navItemVariants> {
  isSelected?: boolean;
  className?: string;
}

export default function NavItem({
  className = '',
  icon,
  isSelected = false,
  root,
  name,
}: NavItemDataProps & NavItemProps) {
  const href = root ? `/${root}` : '/';

  return (
    <Link
      aria-current={isSelected ? 'page' : undefined}
      aria-label={name}
      className={cn(navItemVariants({ selected: isSelected }), className)}
      href={href}
    >
      {icon}
      <span className="hidden md:inline">{name}</span>
    </Link>
  );
}
