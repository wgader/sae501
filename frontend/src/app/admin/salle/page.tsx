'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminSectionTabs, { adminTabVariants } from '@/components/admin/AdminSectionTabs';
import SalleCreateForm from '@/components/admin/salle/SalleCreateForm';
import SallesList from '@/components/admin/salle/SallesList';
import RoomRequestsPanel from '@/components/admin/salle/RoomRequestsPanel';

type Tab = 'rooms' | 'requests';

const TABS: { value: Tab; label: string }[] = [
  { value: 'rooms', label: 'Salles' },
  { value: 'requests', label: 'Réservations ponctuelles' },
];

export default function AdminSallesPage() {
  const [tab, setTab] = useState<Tab>('rooms');
  const [sallesListKey, setSallesListKey] = useState(0);

  return (
    <AdminLayout>
      <section className="mx-auto max-w-328 space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <AdminPageHeader
            title="GESTION DES SALLES"
            description="Gérez les espaces municipaux et traitez les réservations ponctuelles des associations."
          />
          {tab === 'rooms' && <SalleCreateForm onCreated={() => setSallesListKey((key) => key + 1)} />}
        </header>

        <AdminSectionTabs label="Sections de la gestion des salles">
          {TABS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-current={tab === option.value ? 'page' : undefined}
              onClick={() => setTab(option.value)}
              className={adminTabVariants({ active: tab === option.value })}
            >
              {option.label}
            </button>
          ))}
        </AdminSectionTabs>

        {tab === 'rooms' ? <SallesList key={sallesListKey} /> : <RoomRequestsPanel />}
      </section>
    </AdminLayout>
  );
}
