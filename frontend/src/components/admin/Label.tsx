import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

const labelVariants = cva('mb-3 block text-xs font-bold uppercase tracking-widest text-black');

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(labelVariants(), className)}
        {...props}
      >
        {children}
      </label>
    );
  }
);
Label.displayName = 'Label';

export { labelVariants };
