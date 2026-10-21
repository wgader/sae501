'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import SalleCreateForm from '@/components/admin/salle/SalleCreateForm';
import SallesList from '@/components/admin/salle/SallesList';

export default function AdminSallesPage() {
  const [sallesListKey, setSallesListKey] = useState(0);

  return (
    <AdminLayout>
      <section className="mx-auto max-w-6xl">
        <AdminPageHeader
          title="Gestion des salles"
          description="Ajoutez, modifiez et rendez disponibles les espaces de la ville."
          className="mb-8"
        />
        <SalleCreateForm onCreated={() => setSallesListKey((key) => key + 1)} />
        <SallesList key={sallesListKey} />
      </section>
    </AdminLayout>
  );
}
