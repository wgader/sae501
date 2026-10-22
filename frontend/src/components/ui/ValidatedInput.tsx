// components/ui/ValidatedInput.tsx
import { InputHTMLAttributes, ReactNode } from 'react';

interface ValidatedInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  isValid?: boolean;
  children?: ReactNode;
}

export default function ValidatedInput({ 
  label, 
  isValid, 
  children,
  className = '', 
  id,
  name,
  ...props 
}: ValidatedInputProps) {
  const inputId = id ?? name;

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4.5">
      <label htmlFor={inputId} className="text-body font-bold uppercase tracking-section text-ink">{label}</label>
      <div className="relative flex h-16 w-full items-center border-2 border-transparent bg-grey px-4 py-3 transition-all duration-200 focus-within:border-ink">
        <input
          {...props}
          id={inputId}
          name={name}
          className={`w-full bg-transparent text-body font-normal tracking-normal text-ink placeholder:text-ink/70 outline-none ${isValid ? 'pr-10' : ''} ${className}`}
        />
        {isValid && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600">
            <svg className="size-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}