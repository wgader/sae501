import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const formFieldLabelVariants = cva(
  'flex w-full flex-col gap-2 text-[0.63rem] font-bold uppercase tracking-[0.18em]',
);

export const formFieldInputVariants = cva(
  'rounded-control border border-[#d9ded9] bg-white/60 px-4 py-3.5 text-sm font-normal normal-case tracking-normal outline-none transition focus:border-[#496a56] focus:ring-0',
);

export interface FormFieldDataProps {
  label: string;
  required?: boolean;
  labelClassName?: string;
  error?: string;
}

export interface FormFieldProps
  extends InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof formFieldInputVariants> {
  children?: ReactNode;
  containerClassName?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldDataProps & FormFieldProps>(
  (
    {
      label,
      required = true,
      labelClassName,
      error,
      children,
      className,
      containerClassName,
      ...inputProps
    },
    ref,
  ) => {
    return (
      <label className={cn(formFieldLabelVariants(), containerClassName, labelClassName)}>
        <span>
          {label}
          {required ? ' *' : ''}
        </span>
        <span className="relative block w-full">
          <input
            ref={ref}
            required={required}
            className={cn(formFieldInputVariants(), 'w-full', children && 'pr-12', className)}
            {...inputProps}
          />
          {children && (
            <span className="absolute inset-y-0 right-1 flex items-center">
              {children}
            </span>
          )}
        </span>
        {error && <span className="text-sm font-semibold normal-case tracking-normal text-danger">{error}</span>}
      </label>
    );
  },
);

FormField.displayName = 'FormField';

export default FormField;
