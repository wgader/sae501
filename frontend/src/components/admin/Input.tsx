import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const inputVariants = cva(
  'w-full bg-[#d9d9d9] p-4 text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#116c60] disabled:cursor-not-allowed disabled:opacity-50',
);

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(inputVariants(), className)}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { inputVariants };
