'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import GrantRequestCard from '@/components/admin/grant/GrantRequestCard';
import GrantStatusTabs from '@/components/admin/grant/GrantStatusTabs';
import Notice from '@/components/ui/Notice';
import { getAdminGrants, type AdminGrantFilter, type AdminGrantList } from '@/lib/api';

const EMPTY_COUNTS: AdminGrantList['counts'] = { all: 0, pending: 0, validated: 0, refused: 0 };

export default function AdminSubventionsPage() {
  const [filter, setFilter] = useState<AdminGrantFilter>('pending');
  const [list, setList] = useState<AdminGrantList>({ items: [], counts: EMPTY_COUNTS });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getAdminGrants(filter)
      .then((result) => {
        if (active) setList(result);
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Impossible de charger les demandes.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [filter]);

  const changeFilter = (next: AdminGrantFilter) => {
    setLoading(true);
    setError('');
    setFilter(next);
  };

  return (
    <AdminLayout>
      <section className="mx-auto max-w-328 space-y-8">
        <AdminPageHeader
          title="SUBVENTIONS"
          description="Instruisez les demandes d’aides financières transmises par les associations."
        />
        <GrantStatusTabs active={filter} counts={list.counts} onChange={changeFilter} />
        {error && <Notice tone="danger">{error}</Notice>}
        {loading ? (
          <p role="status" className="py-16 text-center text-xs font-bold uppercase tracking-label text-muted">Chargement des demandes…</p>
        ) : list.items.length === 0 ? (
          <section className="rounded-panel border border-line bg-paper py-16 text-center">
            <p className="font-bold text-ink">Aucune demande dans cette catégorie</p>
            <p className="mt-2 text-sm text-muted">Les dossiers apparaissent ici dès qu’une association les transmet.</p>
          </section>
        ) : (
          <ul className="list-none space-y-4 p-0">
            {list.items.map((grant) => <GrantRequestCard key={grant.id} grant={grant} />)}
          </ul>
        )}
      </section>
    </AdminLayout>
  );
}
