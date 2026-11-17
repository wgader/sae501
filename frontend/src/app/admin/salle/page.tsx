'use client';

import { useState } from 'react';
import { cva } from 'class-variance-authority';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import SalleCreateForm from '@/components/admin/salle/SalleCreateForm';
import SallesList from '@/components/admin/salle/SallesList';
import RoomRequestsPanel from '@/components/admin/salle/RoomRequestsPanel';

type Tab = 'rooms' | 'requests';

const TABS: { value: Tab; label: string }[] = [
  { value: 'rooms', label: 'Salles' },
  { value: 'requests', label: 'Réservations ponctuelles' },
];

const tabVariants = cva(
  'border-b-2 px-1 pb-3 text-body-sm font-bold transition-colors cursor-pointer',
  {
    variants: {
      active: {
        true: 'border-primary text-primary',
        false: 'border-transparent text-muted hover:text-ink',
      },
    },
  },
);

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

        <nav aria-label="Sections de la gestion des salles" className="flex gap-6 border-b border-line">
          {TABS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-current={tab === option.value ? 'page' : undefined}
              onClick={() => setTab(option.value)}
              className={tabVariants({ active: tab === option.value })}
            >
              {option.label}
            </button>
          ))}
        </nav>

        {tab === 'rooms' ? <SallesList key={sallesListKey} /> : <RoomRequestsPanel />}
      </section>
    </AdminLayout>
  );
}
