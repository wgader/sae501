'use client';

import { type ReactNode } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AssociationTopNav from '@/components/admin/association/detail/AssociationTopNav';
import { AssociationProvider, useAssociationContext } from './AssociationContext';

function AssociationDetailLayoutContent({ children }: { children: ReactNode }) {
  const { association, loading, error, feedback } = useAssociationContext();

  return (
    <AdminLayout>
      <section className="space-y-8">
        {loading ? (
          <section className="py-20 text-center text-muted" aria-live="polite">
            <svg
              className="mx-auto h-8 w-8 animate-spin text-primary"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="mt-3 text-xs font-bold uppercase tracking-wider">Chargement de la fiche...</p>
          </section>
        ) : error && !association ? (
          <section className="rounded-card border border-danger/30 bg-rose-50/70 p-6 text-center text-danger">
            <p className="text-sm font-semibold">{error}</p>
          </section>
        ) : association ? (
          <>
            <AssociationTopNav
              id={association.id}
              nom={association.nom}
            />

            {feedback && (
              <p
                className="rounded-control border border-primary/30 bg-primary-soft/50 p-4 text-xs font-semibold text-primary"
                role="status"
              >
                {feedback}
              </p>
            )}

            {error && (
              <p
                className="rounded-control border border-danger/30 bg-rose-50/70 p-4 text-xs font-semibold text-danger"
                role="alert"
              >
                {error}
              </p>
            )}

            <section aria-label="Contenu de la section">{children}</section>
          </>
        ) : null}
      </section>
    </AdminLayout>
  );
}

export default function AssociationDetailLayout({ children }: { children: ReactNode }) {
  return (
    <AssociationProvider>
      <AssociationDetailLayoutContent>{children}</AssociationDetailLayoutContent>
    </AssociationProvider>
  );
}
