import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-bold tracking-widest transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#116c60] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-[#116c60] text-white hover:bg-[#0d554a]',
        outline: 'border border-[#116c60] text-[#116c60] hover:bg-[#e8f4f2]',
        danger: 'border border-red-200 text-red-700 hover:bg-red-50',
      },
      size: {
        default: 'px-8 py-3 text-sm',
        sm: 'rounded-lg px-3 py-2 text-xs tracking-normal',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>
  & VariantProps<typeof buttonVariants>;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { buttonVariants };
