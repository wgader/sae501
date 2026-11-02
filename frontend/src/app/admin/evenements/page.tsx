'use client';

import AdminPageHeader from '@/components/admin/AdminPageHeader';

export default function AdminEvenementsPage() {
  return (
    <section className="mx-auto max-w-5xl space-y-8">
      <AdminPageHeader
        title="Gestion des événements"
        description="Consultez et traitez les événements externes soumis par les associations."
      />
      <div className="rounded-[1rem] border border-[var(--line)] bg-[var(--paper)] p-8 text-sm text-[var(--muted)]">
        La gestion des événements sera disponible ici.
      </div>
    </section>
  );
}
