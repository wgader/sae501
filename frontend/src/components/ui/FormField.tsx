import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface FormFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'children'> {
  label: string;
  children?: ReactNode;
  error?: string;
  className?: string;
  containerClassName?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      label,
      children,
      className = '',
      containerClassName = '',
      type = 'text',
      placeholder,
      value,
      error,
      name,
      required = false,
      ...inputProps
    },
    ref,
  ) => {
    const hasError = Boolean(error);

    return (
      <label className={cn('block w-full', containerClassName)}>
        <span className="mb-2 flex items-center gap-1 text-[12px] font-bold uppercase tracking-[0.18em] text-[var(--ink)]">
          {label}
          {required && <span className="text-[var(--Flush-Mahogany)]" aria-hidden="true">*</span>}
        </span>

        <div
          className={cn(
            'relative flex h-[56px] w-full items-center rounded-[10px] border bg-[var(--paper)] px-4 transition-colors duration-200',
            hasError
              ? 'border-[var(--Flush-Mahogany)] ring-2 ring-[var(--Flush-Mahogany)]/10'
              : 'border-[var(--line)] focus-within:border-[var(--Mosaic-Tile)] focus-within:ring-2 focus-within:ring-[var(--Mosaic-Tile)]/10',
            className,
          )}
        >
          <input
            ref={ref}
            type={type}
            value={value}
            name={name}
            placeholder={placeholder}
            required={required}
            aria-invalid={hasError}
            className="h-full w-full bg-transparent text-[15px] text-[var(--ink)] placeholder:text-[var(--muted)]/60 outline-none pr-8"
            {...inputProps}
          />
          {children}
        </div>

        {error && (
          <span id={name ? `${name}-error` : undefined} className="mt-2 block text-[12px] text-[var(--Flush-Mahogany)]">
            {error}
          </span>
        )}
      </label>
    );
  },
);

FormField.displayName = 'FormField';

export default FormField;
