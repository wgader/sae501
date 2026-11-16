import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const validatedInputVariants = cva(
  'w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary sm:px-4 sm:py-3',
  {
    variants: {
      state: {
        default: '',
        valid: 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500',
        invalid: 'border-danger focus:border-danger focus:ring-danger',
      },
    },
    defaultVariants: {
      state: 'default',
    },
  },
);

export interface ValidatedInputDataProps {
  label: string;
  isValid?: boolean;
}

export interface ValidatedInputProps
  extends InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof validatedInputVariants> {
  children?: ReactNode;
  containerClassName?: string;
}

export const ValidatedInput = forwardRef<HTMLInputElement, ValidatedInputDataProps & ValidatedInputProps>(
  (
    {
      label,
      isValid,
      state = isValid ? 'valid' : 'default',
      children,
      className,
      containerClassName,
      ...props
    },
    ref,
  ) => {
    return (
      <div className={cn('flex flex-col gap-2', containerClassName)}>
        <label className="text-xs font-bold text-ink">{label}</label>
        <div className="relative">
          <input
            ref={ref}
            className={cn(validatedInputVariants({ state }), className)}
            {...props}
          />
          {isValid && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </div>
        {children}
      </div>
    );
  },
);

ValidatedInput.displayName = 'ValidatedInput';

export default ValidatedInput;
