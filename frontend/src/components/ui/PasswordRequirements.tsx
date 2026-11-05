import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export interface PasswordRule {
  label: string;
  test: (password: string) => boolean;
}

export const passwordRules: PasswordRule[] = [
  { label: '10 caractères minimum', test: (password: string) => password.length >= 10 },
  { label: '1 lettre en majuscule', test: (password: string) => /[A-Z]/.test(password) },
  { label: '1 lettre en minuscule', test: (password: string) => /[a-z]/.test(password) },
  { label: '1 chiffre', test: (password: string) => /\d/.test(password) },
];

export function isPasswordValid(password: string) {
  return passwordRules.every((rule) => rule.test(password));
}

export const passwordRequirementsVariants = cva(
  'ml-4 mt-1 list-disc space-y-1 text-xs',
);

export const passwordRuleItemVariants = cva('transition-colors', {
  variants: {
    status: {
      valid: 'text-primary marker:text-primary',
      invalid: 'text-danger marker:text-danger',
      idle: 'text-muted marker:text-line',
    },
  },
  defaultVariants: {
    status: 'idle',
  },
});

export interface PasswordRequirementsDataProps {
  password: string;
  rules?: PasswordRule[];
}

export interface PasswordRequirementsProps
  extends HTMLAttributes<HTMLUListElement>,
    VariantProps<typeof passwordRequirementsVariants> {}

export default function PasswordRequirements({
  password,
  rules = passwordRules,
  className,
  ...props
}: PasswordRequirementsDataProps & PasswordRequirementsProps) {
  const hasStarted = password.length > 0;

  return (
    <ul className={cn(passwordRequirementsVariants(), className)} {...props}>
      {rules.map((rule) => {
        const isValid = rule.test(password);
        const status = isValid ? 'valid' : hasStarted ? 'invalid' : 'idle';

        return (
          <li
            key={rule.label}
            className={cn(passwordRuleItemVariants({ status }))}
          >
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
