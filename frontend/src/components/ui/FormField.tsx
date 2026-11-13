import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const formFieldLabelVariants = cva(
  'flex flex-col gap-2 text-[0.63rem] font-bold uppercase tracking-[0.18em]',
);

export const formFieldInputVariants = cva(
  'border border-[#d9ded9] bg-white/60 px-4 py-3.5 text-sm font-normal normal-case tracking-normal outline-none transition focus:border-[#496a56] focus:ring-4 focus:ring-[#496a56]/10',
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
        {children}
        <input
          ref={ref}
          required={required}
          className={cn(formFieldInputVariants(), className)}
          {...inputProps}
        />
        {error && <span className="text-sm font-semibold normal-case tracking-normal text-danger">{error}</span>}
      </label>
    );
  },
);

FormField.displayName = 'FormField';

export default FormField;
