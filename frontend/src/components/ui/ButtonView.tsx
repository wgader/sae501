import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const buttonViewVariants = cva(
  'inline-flex h-[1.94rem] w-[1.94rem] items-center justify-center rounded-[0.63rem] transition-colors',
  {
    variants: {
      variant: {
        selected: 'bg-white text-black hover:bg-gray-50',
        unselected: 'bg-transparent text-black hover:bg-gray-100',
      },
    },
    defaultVariants: {
      variant: 'selected',
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

