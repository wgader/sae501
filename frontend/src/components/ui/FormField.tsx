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
        <span className="mb-2 flex items-center gap-1 text-meta font-bold uppercase tracking-section text-ink">
          {label}
          {required && <span className="text-danger" aria-hidden="true">*</span>}
        </span>

        <div
          className={cn(
            'relative flex h-control w-full items-center rounded-control border bg-paper px-4 transition-colors duration-200',
            hasError
              ? 'border-danger ring-2 ring-danger/10'
              : 'border-line focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10',
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
            className="h-full w-full bg-transparent text-body text-ink placeholder:text-muted/60 outline-none pr-8"
            {...inputProps}
          />
          {children}
        </div>

        {error && (
          <span id={name ? `${name}-error` : undefined} className="mt-2 block text-meta text-danger">
            {error}
          </span>
        )}
      </label>
    );
  },
);

FormField.displayName = 'FormField';

export default FormField;
