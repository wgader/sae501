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
    <div className="flex w-full max-w-[616px] flex-col gap-[18px]">
      <label htmlFor={inputId} className="text-[15px] font-bold uppercase tracking-[3px] text-black">{label}</label>
      <div className="relative flex h-[64px] w-full items-center border-2 border-transparent bg-[#d9d9d9] px-4 py-3 transition-all duration-200 focus-within:border-black">
        <input
          {...props}
          id={inputId}
          name={name}
          className={`w-full bg-transparent text-[15px] font-normal tracking-[0.5px] text-black placeholder:text-black/70 outline-none ${isValid ? 'pr-10' : ''} ${className}`}
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