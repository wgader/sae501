'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import FilterTag from '@/components/admin/FilterTag';
import {
  downloadExternalEventFile,
  getExternalEvent,
  getExternalEvents,
  updateExternalEventStatus,
  type ExternalEvent,
  type ExternalEventFile,
} from '@/lib/api';
import { useAdminSearch } from '@/app/admin/layout';

type StatusFilter = 'ALL' | 'PENDING' | 'VALIDATED' | 'REFUSED';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  VALIDATED: 'Validé',
  ACCEPTED: 'Validé',
  REFUSED: 'Refusé',
  REJECTED: 'Refusé',
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'border-amber-200 bg-amber-50 text-amber-800',
  VALIDATED: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  ACCEPTED: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  REFUSED: 'border-rose-200 bg-rose-50 text-rose-800',
  REJECTED: 'border-rose-200 bg-rose-50 text-rose-800',
};

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

function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.toUpperCase();
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wider ${STATUS_STYLES[normalizedStatus] ?? 'border-slate-200 bg-slate-50 text-slate-700'}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABELS[normalizedStatus] ?? status}
    </span>
  );
}

export default function AdminEvenementsPage() {
  const { searchTerm } = useAdminSearch();
  const [events, setEvents] = useState<ExternalEvent[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ExternalEvent | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [downloadingFileId, setDownloadingFileId] = useState<number | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    let active = true;

    getExternalEvents(1, 50)
      .then((result) => {
        if (active) setEvents(result.items);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Impossible de charger les événements.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedEvent) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setSelectedEvent(null);
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [selectedEvent]);

  const filteredEvents = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase('fr-FR');
    return events.filter((event) => {
      const matchesStatus = statusFilter === 'ALL' || event.status.toUpperCase() === statusFilter;
      const matchesDate = !dateFilter || event.start_date.slice(0, 10) === dateFilter;
      const matchesSearch = !query || [event.title, event.location, event.event_type]
        .some((value) => value.toLocaleLowerCase('fr-FR').includes(query));
      return matchesStatus && matchesDate && matchesSearch;
    });
  }, [dateFilter, events, searchTerm, statusFilter]);

  async function openEvent(event: ExternalEvent) {
    setSelectedEvent(event);
    setDetailError(null);
    setIsDetailLoading(true);
    try {
      const detail = await getExternalEvent(event.id);
      setSelectedEvent(detail);
    } catch (err: unknown) {
      setDetailError(err instanceof Error ? err.message : 'Impossible de charger le dossier.');
    } finally {
      setIsDetailLoading(false);
    }
  }

  async function handleDownload(file: ExternalEventFile) {
    setDownloadingFileId(file.id);
    setDetailError(null);
    try {
      await downloadExternalEventFile(file.id, file.original_name);
    } catch (err: unknown) {
      setDetailError(err instanceof Error ? err.message : 'Impossible de télécharger le fichier.');
    } finally {
      setDownloadingFileId(null);
    }
  }

  async function handleValidate() {
    if (!selectedEvent) return;

    setIsValidating(true);
    setDetailError(null);
    try {
      const updatedEvent = await updateExternalEventStatus(selectedEvent.id, 'VALIDATED');
      setSelectedEvent((current) => current ? { ...current, ...updatedEvent } : updatedEvent);
      setEvents((current) => current.map((event) => (
        event.id === updatedEvent.id ? { ...event, ...updatedEvent } : event
      )));
    } catch (err: unknown) {
      setDetailError(err instanceof Error ? err.message : 'Impossible de valider l’événement.');
    } finally {
      setIsValidating(false);
    }
  }

  return (
    <>
      <section className="mx-auto max-w-6xl">
        <AdminPageHeader
          title="Événements extérieurs"
          description="Consultez les manifestations déclarées par les associations et leurs justificatifs."
          className="mb-7"
        >
          <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <nav aria-label="Filtrer par statut" className="flex flex-wrap gap-2">
              {[
                ['ALL', 'Tous'],
                ['PENDING', 'En attente'],
                ['VALIDATED', 'Validés'],
                ['REFUSED', 'Refusés'],
              ].map(([value, label]) => (
                <FilterTag
                  key={value}
                  label={label}
                  isSelected={statusFilter === value}
                  onClick={() => setStatusFilter(value as StatusFilter)}
                  className="min-h-10 min-w-0 px-4 py-2 text-[0.7rem]"
                />
              ))}
            </nav>
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              Date de début
              <input
                type="date"
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                className="rounded-lg border border-[var(--line)] bg-[var(--White)] px-3 py-2 text-sm font-normal normal-case tracking-normal text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--Mosaic-Tile)]/30"
              />
            </label>
          </div>
        </AdminPageHeader>

        {error && (
          <p role="alert" className="mb-6 rounded-[10px] border-l-4 border-[var(--Flush-Mahogany)] bg-rose-50/70 p-4 text-xs font-semibold text-[var(--Flush-Mahogany)]">
            {error}
          </p>
        )}

        {loading ? (
          <div className="rounded-[20px] border border-[var(--line)] bg-[var(--paper)] py-16 text-center text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            Chargement des événements...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="rounded-[20px] border border-[var(--line)] bg-[var(--paper)] py-16 text-center">
            <p className="font-bold text-[var(--ink)]">Aucun événement trouvé</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Modifiez vos filtres ou votre recherche.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[20px] border border-[var(--line)] bg-[var(--White)] shadow-xs">
            <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(140px,1fr)_minmax(130px,1fr)_auto] gap-5 border-b border-[var(--line)] bg-[var(--paper)] px-6 py-3 text-[0.68rem] font-bold uppercase tracking-wider text-[var(--muted)] md:grid">
              <span>Manifestation</span>
              <span>Date</span>
              <span>Statut</span>
              <span className="text-right">Action</span>
            </div>
            <ul className="divide-y divide-[var(--line)]">
              {filteredEvents.map((event) => (
                <li key={event.id} className="grid gap-4 px-5 py-5 md:grid-cols-[minmax(0,1.5fr)_minmax(140px,1fr)_minmax(130px,1fr)_auto] md:items-center md:gap-5 md:px-6">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-[var(--ink)]">{event.title}</p>
                    <p className="mt-1 truncate text-xs text-[var(--muted)]">{event.event_type} · {event.location}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink)]">{formatDate(event.start_date)}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">Dossier #{event.id}</p>
                  </div>
                  <div><StatusBadge status={event.status} /></div>
                  <button
                    type="button"
                    onClick={() => openEvent(event)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--Mosaic-Tile)] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--Mosaic-Tile)]/40"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.5-6.75 9.75-6.75S21.75 12 21.75 12 18.25 18.75 12 18.75 2.25 12 2.25 12Z" />
                      <circle cx="12" cy="12" r="2.5" />
                    </svg>
                    Voir les pièces
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs" role="dialog" aria-modal="true" aria-labelledby="event-modal-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedEvent(null); }}>
          <section className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[24px] bg-[var(--White)] shadow-2xl">
            <header className="flex items-start justify-between border-b border-[var(--line)] px-6 py-5 sm:px-8">
              <div>
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[var(--Mosaic-Tile)]">Fiche événement · #{selectedEvent.id}</p>
                <h2 id="event-modal-title" className="mt-2 text-xl font-black text-[var(--ink)]">{selectedEvent.title}</h2>
              </div>
              <button type="button" onClick={() => setSelectedEvent(null)} aria-label="Fermer la fiche" className="rounded-lg p-2 text-[var(--muted)] transition hover:bg-[var(--paper)] hover:text-[var(--ink)]">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="m6 6 12 12M18 6 6 18" /></svg>
              </button>
            </header>

            <div className="space-y-6 px-6 py-6 sm:px-8">
              {selectedEvent.status.toUpperCase() === 'PENDING' && (
                <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-amber-900">Dossier en attente d’instruction</p>
                    <p className="mt-1 text-xs text-amber-800">La validation rendra cet événement accepté par la Mairie.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleValidate}
                    disabled={isValidating || isDetailLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--Mosaic-Tile)] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
                  >
                    {isValidating ? 'Validation...' : 'Valider l’événement'}
                  </button>
                </div>
              )}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <StatusBadge status={selectedEvent.status} />
                <span className="text-xs text-[var(--muted)]">Déclaré le {formatDate(selectedEvent.created_at)}</span>
              </div>
              <dl className="grid gap-4 rounded-[16px] bg-[var(--paper)] p-5 sm:grid-cols-2">
                <div><dt className="text-xs text-[var(--muted)]">Type de manifestation</dt><dd className="mt-1 text-sm font-bold">{selectedEvent.event_type}</dd></div>
                <div><dt className="text-xs text-[var(--muted)]">Lieu</dt><dd className="mt-1 text-sm font-bold">{selectedEvent.location}</dd></div>
                <div><dt className="text-xs text-[var(--muted)]">Début</dt><dd className="mt-1 text-sm font-bold">{formatDate(selectedEvent.start_date, true)}</dd></div>
                <div><dt className="text-xs text-[var(--muted)]">Fin</dt><dd className="mt-1 text-sm font-bold">{formatDate(selectedEvent.end_time, true)}</dd></div>
                <div><dt className="text-xs text-[var(--muted)]">Association</dt><dd className="mt-1 text-sm font-bold">Association #{selectedEvent.asso_id}</dd></div>
              </dl>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-black uppercase tracking-wider text-[var(--ink)]">Pièces jointes</h3>
                  <span className="text-xs text-[var(--muted)]">{selectedEvent.files?.length ?? 0} document(s)</span>
                </div>
                {isDetailLoading ? (
                  <p className="mt-4 rounded-xl border border-[var(--line)] p-4 text-sm text-[var(--muted)]">Chargement des pièces...</p>
                ) : selectedEvent.files && selectedEvent.files.length > 0 ? (
                  <ul className="mt-3 space-y-2">
                    {selectedEvent.files.map((file) => (
                      <li key={file.id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] p-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--Pale-Sage)] text-[var(--Mosaic-Tile)]">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M7 3.75h7.5L19 8.25v12A1.75 1.75 0 0 1 17.25 22h-10.5A1.75 1.75 0 0 1 5 20.25V5.75A2 2 0 0 1 7 3.75Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M14 4v5h5M8.5 13h7M8.5 16.5h5" /></svg>
                          </span>
                          <span className="min-w-0"><span className="block truncate text-sm font-bold text-[var(--ink)]">{file.original_name}</span><span className="text-xs text-[var(--muted)]">{formatFileSize(file.file_size)}</span></span>
                        </div>
                        <button type="button" onClick={() => handleDownload(file)} disabled={downloadingFileId === file.id} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--Mosaic-Tile)] px-3 py-2 text-xs font-bold text-[var(--Mosaic-Tile)] transition hover:bg-[var(--Pale-Sage)] disabled:cursor-wait disabled:opacity-50">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" /></svg>
                          {downloadingFileId === file.id ? '...' : 'Télécharger'}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 rounded-xl border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)]">Aucun document joint à ce dossier.</p>
                )}
              </div>
              {detailError && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-xs font-semibold text-[var(--Flush-Mahogany)]">{detailError}</p>}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
