'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import EquipmentRequestRow from '@/components/admin/equipment/requests/EquipmentRequestRow';
import EquipmentRequestTile from '@/components/admin/equipment/requests/EquipmentRequestTile';
import RequestViewToggle, { type RequestView } from '@/components/admin/equipment/requests/RequestViewToggle';
import EquipmentReservationStatusTabs, { type EquipmentReservationStatus } from '@/components/admin/equipment/EquipmentReservationStatusTabs';
import EquipmentSectionTabs from '@/components/admin/equipment/EquipmentSectionTabs';
import Notice from '@/components/ui/Notice';
import Pagination from '@/components/ui/Pagination';
import { useStoredView } from '@/hooks/useStoredView';
import { getAdminEquipmentReservations, type AdminEquipmentReservation } from '@/lib/api';

const VIEWS = ['list', 'cards'] as const satisfies readonly RequestView[];

export default function AdminEquipmentReservationsPage() {
  const [status, setStatus] = useState<EquipmentReservationStatus>('En attente');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<AdminEquipmentReservation[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [counts, setCounts] = useState({ pending: 0, validated: 0, refused: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useStoredView<RequestView>('admin-equipment-requests-view', VIEWS, 'list');

  useEffect(() => {
    let active = true;
    getAdminEquipmentReservations(page, status, search)
      .then((result) => {
        if (!active) return;
        setItems(result.items);
        setTotalItems(result.totalItems);
        setCounts(result.counts);
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Impossible de charger les demandes.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [page, search, status]);

  return (
    <AdminLayout searchTerm={search} onSearchChange={(value) => { setSearch(value); setPage(1); }}>
      <section className="mx-auto max-w-328 space-y-8">
        <AdminPageHeader
          title="GESTION DU MATÉRIEL"
          description="Gérez le parc communal, les durées d’emprunt et les demandes des associations."
        />
        <EquipmentSectionTabs />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <EquipmentReservationStatusTabs
            activeStatus={status}
            counts={counts}
            onChange={(value) => { setStatus(value); setPage(1); }}
          />
          <RequestViewToggle value={view} onChange={setView} />
        </div>
        {error && <Notice tone="danger">{error}</Notice>}
        {loading ? (
          <p className="py-16 text-center text-xs font-bold uppercase tracking-label text-muted">Chargement des demandes...</p>
        ) : items.length === 0 ? (
          <section className="rounded-panel border border-line bg-paper py-16 text-center">
            <p className="font-bold text-ink">Aucune demande trouvée</p>
            <p className="mt-2 text-sm text-muted">Il n’y a aucune réservation dans cette catégorie.</p>
          </section>
        ) : (
          <ul className={view === 'cards' ? 'grid gap-5 sm:grid-cols-2 xl:grid-cols-3' : 'space-y-3'}>
            {items.map((reservation) => (
              <li key={reservation.id}>
                {view === 'cards' ? <EquipmentRequestTile reservation={reservation} /> : <EquipmentRequestRow reservation={reservation} />}
              </li>
            ))}
          </ul>
        )}
        <Pagination page={page} totalPages={Math.max(1, Math.ceil(totalItems / 10))} totalItems={totalItems} itemsPerPage={10} itemLabel="réservation" onPageChange={setPage} />
      </section>
    </AdminLayout>
  );
}
