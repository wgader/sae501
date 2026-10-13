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

    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
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
        'flex items-center gap-[10px] self-start text-[20px] font-black uppercase tracking-[2px] text-white',
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-[30px] w-[30px] rotate-180"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12h12" />
        <path d="M13 5l7 7-7 7" />
      </svg>
      <span>{label}</span>
    </button>
  );
}
