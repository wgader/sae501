'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import EventDetailModal from '@/components/admin/events/EventDetailModal';
import EventFilters, { type StatusFilter } from '@/components/admin/events/EventFilters';
import EventList from '@/components/admin/events/EventList';
import {
  downloadExternalEventFile,
  getExternalEvent,
  getExternalEvents,
  updateExternalEventStatus,
  type ExternalEvent,
  type ExternalEventFile,
} from '@/lib/api';

type AdminEvenementsPageProps = {
  searchTerm?: string;
};

export default function AdminEvenementsPage({ searchTerm = '' }: AdminEvenementsPageProps) {
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
      .then((result) => { if (active) setEvents(result.items); })
      .catch((requestError: unknown) => { if (active) setError(requestError instanceof Error ? requestError.message : 'Impossible de charger les événements.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
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
      setSelectedEvent(await getExternalEvent(event.id));
    } catch (requestError: unknown) {
      setDetailError(requestError instanceof Error ? requestError.message : 'Impossible de charger le dossier.');
    } finally {
      setIsDetailLoading(false);
    }
  }

  async function handleDownload(file: ExternalEventFile) {
    setDownloadingFileId(file.id);
    setDetailError(null);
    try {
      await downloadExternalEventFile(file.id, file.original_name);
    } catch (requestError: unknown) {
      setDetailError(requestError instanceof Error ? requestError.message : 'Impossible de télécharger le fichier.');
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
      setEvents((current) => current.map((event) => event.id === updatedEvent.id ? { ...event, ...updatedEvent } : event));
    } catch (requestError: unknown) {
      setDetailError(requestError instanceof Error ? requestError.message : 'Impossible de valider l’événement.');
    } finally {
      setIsValidating(false);
    }
  }

  return (
    <section className="mx-auto max-w-6xl">
      <AdminPageHeader
        title="Événements extérieurs"
        description="Consultez les manifestations déclarées par les associations et leurs justificatifs."
        className="mb-7"
      >
        <EventFilters
          statusFilter={statusFilter}
          dateFilter={dateFilter}
          onStatusChange={setStatusFilter}
          onDateChange={setDateFilter}
        />
      </AdminPageHeader>
      {error && <p role="alert" className="mb-6 rounded-[10px] border-l-4 border-[var(--Flush-Mahogany)] bg-rose-50/70 p-4 text-xs font-semibold text-[var(--Flush-Mahogany)]">{error}</p>}
      <EventList events={filteredEvents} loading={loading} onOpen={openEvent} />
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          isLoading={isDetailLoading}
          detailError={detailError}
          downloadingFileId={downloadingFileId}
          isValidating={isValidating}
          onClose={() => setSelectedEvent(null)}
          onDownload={handleDownload}
          onValidate={handleValidate}
        />
      )}
    </section>
  );
}
