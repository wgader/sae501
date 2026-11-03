import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const buttonViewVariants = cva(
  'inline-flex h-8 w-8 items-center justify-center rounded-pill transition-colors cursor-pointer',
  {
    variants: {
      variant: {
        selected: 'bg-transparent text-ink hover:bg-line/50 hover:text-primary',
        unselected: 'bg-transparent text-muted hover:bg-line/50 hover:text-ink',
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
