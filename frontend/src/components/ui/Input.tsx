import React from 'react';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full bg-grey p-4 text-sm text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary ${className}`}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
