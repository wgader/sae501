import type { ReactNode } from 'react';

interface RequestInfoFieldProps {
  label: string;
  children: ReactNode;
}

/** Libellé et valeur d'une fiche de demande. */
export default function RequestInfoField({ label, children }: RequestInfoFieldProps) {
  return (
    <div className="min-w-0">
      <dt className="text-label font-bold uppercase tracking-label text-muted">{label}</dt>
      <dd className="mt-1 wrap-break-word text-body-sm font-semibold text-ink">{children}</dd>
    </div>
  );
}
