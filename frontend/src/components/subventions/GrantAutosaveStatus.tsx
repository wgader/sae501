import type { AutosaveStatus } from '@/hooks/useGrantAutosave';

interface GrantAutosaveStatusProps {
  status: AutosaveStatus;
  savedAt: Date | null;
}

const timeFormatter = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });

/** Indique discrètement où en est l’enregistrement automatique du brouillon. */
export default function GrantAutosaveStatus({ status, savedAt }: GrantAutosaveStatusProps) {
  if (status === 'idle') return null;

  return (
    <p role="status" className="mt-4 flex items-center gap-2 text-body-sm text-muted">
      {status === 'saving' && (
        <>
          <span className="size-2 animate-pulse rounded-full bg-primary" aria-hidden="true" />
          Enregistrement automatique…
        </>
      )}
      {status === 'saved' && savedAt && (
        <>
          <span className="size-2 rounded-full bg-moss" aria-hidden="true" />
          Brouillon enregistré automatiquement à {timeFormatter.format(savedAt)}
        </>
      )}
      {status === 'error' && (
        <span className="text-danger">L’enregistrement automatique a échoué : utilisez « Enregistrer le brouillon ».</span>
      )}
    </p>
  );
}
