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
      <section className="space-y-8">
        <AdminPageHeader
          title="GESTION DES SALLES"
          description="Ajoutez, modifiez et rendez disponibles les espaces municipaux de la ville."
        />
        <SalleCreateForm onCreated={() => setSallesListKey((key) => key + 1)} />
        <SallesList key={sallesListKey} />
      </section>
    </AdminLayout>

  );
}
