import { type ButtonHTMLAttributes, forwardRef, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-[0.63rem] font-bold uppercase transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--Mosaic-Tile)] text-[var(--White)] shadow-xs hover:opacity-90 active:opacity-100',
        secondary:
          'border border-[var(--line)] bg-[var(--White)] text-[var(--ink)] shadow-xs hover:bg-[var(--paper)] active:bg-[var(--line)]',
        danger:
          'border border-[var(--Flush-Mahogany)] bg-[var(--White)] text-[var(--Flush-Mahogany)] shadow-xs hover:bg-[var(--Flush-Mahogany)] hover:text-[var(--White)] active:opacity-95',
        ghost:
          'bg-transparent text-[var(--ink)] hover:bg-[var(--paper)] active:bg-[var(--line)]',
      },
      size: {
        sm: 'h-9 px-4 text-[0.69rem] tracking-[0.12em]',
        md: 'h-[3rem] px-6 text-xs tracking-[0.14em]',
        lg: 'h-[3.25rem] px-8 text-xs tracking-[0.16em]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant,
      size,
      isLoading = false,
      leftIcon,
      rightIcon,
      className,
      disabled,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {isLoading ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Traitement...</span>
          </>
        ) : (
          <>
            {leftIcon}
            <span>{children}</span>
            {rightIcon}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';

export default Button;