import type { InputHTMLAttributes, ReactNode } from 'react';

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  children?: ReactNode;
};

export default function FormField({ label, children, className = '', ...inputProps }: FormFieldProps) {
  return (
    <label className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-[0.18em]">
      {label} *
      {children}
      <input
        {...inputProps}
        className={`border border-[#d9ded9] bg-white/60 px-4 py-3.5 text-sm font-normal normal-case tracking-normal outline-none transition focus:border-[#496a56] focus:ring-4 focus:ring-[#496a56]/10 ${className}`}
      />
    </label>
  );
}
