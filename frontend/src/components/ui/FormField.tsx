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
      <span className="mb-2 flex items-center gap-1 text-[12px] font-bold uppercase tracking-[0.18em] text-[var(--ink)]">
        {label}
        {required && <span className="text-[var(--Flush-Mahogany)]" aria-hidden="true">*</span>}
      </span>

      <div
        className={cn(
          'relative flex h-[56px] w-full items-center rounded-[10px] border bg-[var(--paper)] px-4 transition-colors duration-200',
          hasError ? 'border-[var(--Flush-Mahogany)]' : 'border-[var(--Grey)] focus-within:border-[var(--Mosaic-Tile)]',
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
          className="h-full w-full bg-transparent text-[15px] text-[var(--ink)] placeholder:text-[var(--ink)]/50 outline-none"
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
}
