'use client';

import type { ExternalEvent, ExternalEventFile } from '@/lib/api';
import EventStatusBadge from './EventStatusBadge';

interface EventDetailModalProps {
  event: ExternalEvent;
  isLoading: boolean;
  detailError: string | null;
  downloadingFileId: number | null;
  isValidating: boolean;
  onClose: () => void;
  onDownload: (file: ExternalEventFile) => void;
  onValidate: () => void;
}

function formatDate(value: string, withTime = false): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date inconnue';
  return date.toLocaleDateString('fr-FR', withTime
    ? { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function EventDetailModal({
  event,
  isLoading,
  detailError,
  downloadingFileId,
  isValidating,
  onClose,
  onDownload,
  onValidate,
}: EventDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs" role="dialog" aria-modal="true" aria-labelledby="event-modal-title" onMouseDown={(mouseEvent) => { if (mouseEvent.target === mouseEvent.currentTarget) onClose(); }}>
      <section className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[24px] bg-[var(--White)] shadow-2xl">
        <header className="flex items-start justify-between border-b border-[var(--line)] px-6 py-5 sm:px-8">
          <div><p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[var(--Mosaic-Tile)]">Fiche événement · #{event.id}</p><h2 id="event-modal-title" className="mt-2 text-xl font-black text-[var(--ink)]">{event.title}</h2></div>
          <button type="button" onClick={onClose} aria-label="Fermer la fiche" className="rounded-lg p-2 text-[var(--muted)] transition hover:bg-[var(--paper)] hover:text-[var(--ink)]">×</button>
        </header>
        <div className="space-y-6 px-6 py-6 sm:px-8">
          {event.status.toUpperCase() === 'PENDING' && <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-bold text-amber-900">Dossier en attente d’instruction</p><p className="mt-1 text-xs text-amber-800">La validation rendra cet événement accepté par la Mairie.</p></div><button type="button" onClick={onValidate} disabled={isValidating || isLoading} className="rounded-lg bg-[var(--Mosaic-Tile)] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white disabled:cursor-wait disabled:opacity-60">{isValidating ? 'Validation...' : 'Valider l’événement'}</button></div>}
          <div className="flex flex-wrap items-center justify-between gap-3"><EventStatusBadge status={event.status} /><span className="text-xs text-[var(--muted)]">Déclaré le {formatDate(event.created_at)}</span></div>
          <dl className="grid gap-4 rounded-[16px] bg-[var(--paper)] p-5 sm:grid-cols-2">
            <div><dt className="text-xs text-[var(--muted)]">Type de manifestation</dt><dd className="mt-1 text-sm font-bold">{event.event_type}</dd></div>
            <div><dt className="text-xs text-[var(--muted)]">Lieu</dt><dd className="mt-1 text-sm font-bold">{event.location}</dd></div>
            <div><dt className="text-xs text-[var(--muted)]">Début</dt><dd className="mt-1 text-sm font-bold">{formatDate(event.start_date, true)}</dd></div>
            <div><dt className="text-xs text-[var(--muted)]">Fin</dt><dd className="mt-1 text-sm font-bold">{formatDate(event.end_time, true)}</dd></div>
            <div><dt className="text-xs text-[var(--muted)]">Association</dt><dd className="mt-1 text-sm font-bold">Association #{event.asso_id}</dd></div>
          </dl>
          <div>
            <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-black uppercase tracking-wider text-[var(--ink)]">Pièces jointes</h3><span className="text-xs text-[var(--muted)]">{event.files?.length ?? 0} document(s)</span></div>
            {isLoading ? <p className="mt-4 rounded-xl border border-[var(--line)] p-4 text-sm text-[var(--muted)]">Chargement des pièces...</p> : event.files?.length ? <ul className="mt-3 space-y-2">{event.files.map((file) => <li key={file.id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] p-3"><span className="min-w-0"><span className="block truncate text-sm font-bold text-[var(--ink)]">{file.original_name}</span><span className="text-xs text-[var(--muted)]">{formatFileSize(file.file_size)}</span></span><button type="button" onClick={() => onDownload(file)} disabled={downloadingFileId === file.id} className="shrink-0 rounded-lg border border-[var(--Mosaic-Tile)] px-3 py-2 text-xs font-bold text-[var(--Mosaic-Tile)] disabled:cursor-wait disabled:opacity-50">{downloadingFileId === file.id ? '...' : 'Télécharger'}</button></li>)}</ul> : <p className="mt-3 rounded-xl border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)]">Aucun document joint à ce dossier.</p>}
          </div>
          {detailError && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-xs font-semibold text-[var(--Flush-Mahogany)]">{detailError}</p>}
        </div>
      </section>
    </div>
  );
}
