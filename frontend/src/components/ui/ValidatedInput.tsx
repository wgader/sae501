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
  ...props 
}: ValidatedInputProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-bold text-[#1e2420]">{label}</label>
      <div className="relative">
        <input
          {...props}
          className={`w-full rounded-md border border-[#d9ded9] bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#0b644d] focus:ring-1 focus:ring-[#0b644d] sm:px-4 sm:py-3 ${className}`}
        />
        {isValid && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4CAF50]">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}