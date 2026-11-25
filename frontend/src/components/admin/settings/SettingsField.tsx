import type { ReactElement } from 'react';
import { fieldHintVariants, fieldLabelVariants } from '@/components/admin/campaign/fieldStyles';

interface SettingsFieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  /** Le champ reçoit lui-même id, aria-invalid et aria-describedby (voir fieldA11y). */
  children: ReactElement;
}

export function fieldA11y(id: string, error?: string, hasHint = false) {
  const describedBy = [error ? `${id}-error` : null, hasHint ? `${id}-hint` : null].filter(Boolean).join(' ');
  return {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy || undefined,
  };
}

/** Libellé, champ, aide et erreur d'un réglage. L'erreur est annoncée sans dépendre de la couleur. */
export default function SettingsField({ id, label, hint, error, children }: SettingsFieldProps) {
  return (
    <div>
      <label htmlFor={id} className={fieldLabelVariants()}>
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className={fieldHintVariants({ tone: 'danger' })}>
          {error}
        </p>
      )}
      {hint && (
        <p id={`${id}-hint`} className={fieldHintVariants()}>
          {hint}
        </p>
      )}
    </div>
  );
}
