import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface FormFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'children'> {
  label: string;
  children?: ReactNode;
  error?: string;
  className?: string;
}

export default function FormField({
  label,
  children,
  className = '',
  type = 'text',
  placeholder = 'Placeholder',
  value,
  error,
  name,
  required = false,
  ...inputProps
}: FormFieldProps) {
  const hasError = Boolean(error);

  return (
    <label className="block w-full">
      <span className="mb-2 flex items-center gap-1 text-meta font-bold uppercase tracking-section text-ink">
        {label}
        {required && <span className="text-danger" aria-hidden="true">*</span>}
      </span>

      <div
        className={cn(
          'relative flex h-control w-full items-center rounded-control border bg-paper px-4 transition-colors duration-200',
          hasError ? 'border-danger' : 'border-grey focus-within:border-primary',
          className,
        )}
      >
        <input
          {...inputProps}
          type={type}
          value={value}
          name={name}
          placeholder={placeholder}
          required={required}
          aria-invalid={hasError}
          className="h-full w-full bg-transparent text-body text-ink placeholder:text-ink/50 outline-none"
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
}
