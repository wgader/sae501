'use client';

import type { ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const switchTrackVariants = cva(
  'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-pill border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      checked: {
        true: 'bg-primary',
        false: 'bg-line',
      },
    },
    defaultVariants: {
      checked: false,
    },
  },
);

export const switchThumbVariants = cva(
  'pointer-events-none inline-block h-5 w-5 transform rounded-pill bg-white shadow-xs ring-0 transition duration-200 ease-in-out',
  {
    variants: {
      checked: {
        true: 'translate-x-5',
        false: 'translate-x-0',
      },
    },
    defaultVariants: {
      checked: false,
    },
  },
);

export interface SwitchProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'>,
    VariantProps<typeof switchTrackVariants> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  ariaLabel?: string;
}

export default function Switch({
  id,
  checked,
  onCheckedChange,
  disabled = false,
  ariaLabel,
  className,
  ...props
}: SwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(switchTrackVariants({ checked }), className)}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(switchThumbVariants({ checked }))}
      />
    </button>
  );
}
