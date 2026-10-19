'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

const AGENTS = [
  {
    id: 1,
    nom: 'Faure',
    prenom: 'Alain',
    initials: 'AF',
    email: 'admin@mairie.fr',
    role: 'Administrateur général',
    service: 'Direction générale des services',
  },
  {
    id: 2,
    nom: 'Mairie',
    prenom: 'Admin',
    initials: 'AM',
    email: 'admin@feytiat-association.fr',
    role: 'Administrateur technique',
    service: 'Service Vie associative',
  },
];

export default function AdminAgentsPage() {
  return (
    <AdminLayout>
      <section className="mx-auto max-w-5xl space-y-8">
        <AdminPageHeader
          title="Agents municipaux"
          description="Personnel habilité à valider les dossiers et administrer les accès associatifs."
        />

        <section aria-labelledby="agents-list-heading">
          <h2 id="agents-list-heading" className="sr-only">Liste des agents</h2>

          <ul className="space-y-4 p-0 list-none">
            {AGENTS.map((agent) => (
              <li key={agent.id}>
                <article className="flex items-center justify-between gap-4 rounded-[18px] border border-[var(--line)] bg-[var(--paper)] p-5 sm:p-6 transition hover:border-[var(--Mosaic-Tile)]/40 hover:shadow-sm">
                  <header className="flex items-center gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--Lime-Cream)] text-xs font-black text-[var(--ink)]">
                      {agent.initials}
                    </span>

                    <span>
                      <h3 className="text-sm sm:text-base font-bold text-[var(--ink)]">
                        {agent.prenom} {agent.nom}
                      </h3>
                      <p className="text-xs text-[var(--muted)]">
                        {agent.service} · {agent.email}
                      </p>
                    </span>
                  </header>

                  <span className="rounded-full bg-[var(--Mosaic-Tile)] px-3 py-1 text-xs font-bold text-[var(--White)]">
                    {agent.role}
                  </span>
                </article>
              </li>
            ))}
          </ul>
        </section>
      </section>
    </AdminLayout>
  );
}
