'use client';

import { useRouter } from 'next/navigation';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';

interface BackButtonProps extends Omit<ComponentPropsWithoutRef<'button'>, 'onClick'> {
  label?: string;
  onClick?: () => void;
}

export default function BackButton({
  label = 'Retour',
  onClick,
  className,
  type = 'button',
  ...props
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }

    router.push('/');
  };

  return (
    <button
      {...props}
      type={type}
      onClick={handleClick}
      className={cn(
        'group inline-flex items-center gap-1.5 self-start text-xs font-bold uppercase tracking-[0.14em] text-white transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-0.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 19l-7-7 7-7" />
      </svg>
      <span>{label}</span>
    </button>
  );
}
