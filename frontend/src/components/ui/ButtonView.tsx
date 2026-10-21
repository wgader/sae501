import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const buttonViewVariants = cva(
  'inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors cursor-pointer',
  {
    variants: {
      variant: {
        selected: 'bg-transparent text-[var(--ink)] hover:bg-[var(--line)]/50 hover:text-[var(--Mosaic-Tile)]',
        unselected: 'bg-transparent text-[var(--muted)] hover:bg-[var(--line)]/50 hover:text-[var(--ink)]',
      },
    },
    defaultVariants: {
      variant: 'unselected',
    },
  },
);

export interface ButtonViewProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonViewVariants> {}

export const ButtonView = forwardRef<HTMLButtonElement, ButtonViewProps>(
  (
    {
      variant,
      className,
      children,
      type = 'button',
      'aria-label': ariaLabel = 'Voir',
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        aria-label={ariaLabel}
        className={cn(buttonViewVariants({ variant }), className)}
        {...props}
      >
        {children}
      </button>
    );
  },
);

ButtonView.displayName = 'ButtonView';

export default ButtonView;

