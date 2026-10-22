'use client';

import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

const MODULES = [
  {
    id: 'subventions',
    title: 'Demandes de subventions',
    tag: 'FINANCES',
    description: 'Gestion des demandes d’aides financières annuelles déposées par les associations de Feytiat.',
    status: 'Actif',
  },
  {
    id: 'salles',
    title: 'Réservation de salles',
    tag: 'ESPACES MUNICIPAUX',
    description: 'Planning des salles communales, disponibilités et instruction des réservations.',
    status: 'Actif',
  },
  {
    id: 'materiel',
    title: 'Prêt de matériel',
    tag: 'LOGISTIQUE',
    description: 'Catalogue des équipements, tables, chaises et matériel sonorisation mis à disposition.',
    status: 'Actif',
    href: '/admin/materiel',
  },
  {
    id: 'evenements',
    title: 'Déclarations d’événements',
    tag: 'MANIFESTATIONS',
    description: 'Suivi des rassemblements, tournois et manifestations publiques organisés sur la commune.',
    status: 'Actif',
  },
];

export default function AdminModulesPage() {
  return (
    <AdminLayout>
      <section className="mx-auto max-w-5xl space-y-8">
        <AdminPageHeader
          title="Modules municipaux"
          description="Services et démarches disponibles pour les associations habilitées par la mairie de Feytiat."
        />

        <section aria-labelledby="modules-list-heading">
          <h2 id="modules-list-heading" className="sr-only">Liste des modules</h2>

          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 p-0 list-none">
            {MODULES.map((module) => (
              <li key={module.id}>
                <article className="flex h-full flex-col justify-between rounded-[20px] border border-[var(--line)] bg-[var(--paper)] p-6 transition hover:border-[var(--Mosaic-Tile)]/40 hover:shadow-md">
                  <header>
                    <span className="flex items-center justify-between">
                      <span className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[var(--Mosaic-Tile)]">
                        {module.tag}
                      </span>
                      <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-800">
                        {module.status}
                      </span>
                    </span>

                    <h3 className="mt-4 text-lg font-bold text-[var(--ink)]">
                      {module.title}
                    </h3>

                    <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
                      {module.description}
                    </p>
                  </header>

                  <footer className="mt-6 border-t border-[var(--line)] pt-4 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                    <span>Activé par défaut</span>
                    {module.href ? (
                      <Link
                        href={module.href}
                        className="text-[var(--Mosaic-Tile)] hover:underline font-bold"
                      >
                        Gérer le parc →
                      </Link>
                    ) : (
                      <span className="text-[var(--Mosaic-Tile)] font-semibold">Configuré</span>
                    )}
                  </footer>
                </article>
              </li>
            ))}
          </ul>
        </section>
      </section>
    </AdminLayout>
  );
}
