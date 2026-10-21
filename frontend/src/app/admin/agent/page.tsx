'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AgentCard, { type MunicipalAgent } from '@/components/admin/agent/AgentCard';

const AGENTS: MunicipalAgent[] = [
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
                <AgentCard agent={agent} />
              </li>
            ))}
          </ul>
        </section>
      </section>
    </AdminLayout>
  );
}
