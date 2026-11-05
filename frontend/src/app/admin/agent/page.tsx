'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AgentCard from '@/components/admin/agent/AgentCard';
import { deleteMunicipalAgent, getMunicipalAgents, type MunicipalAgent } from '@/lib/api';

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<MunicipalAgent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMunicipalAgents()
      .then(setAgents)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Impossible de charger les agents.'));
  }, []);

  async function handleDelete(id: number) {
    if (!window.confirm('Supprimer cet agent municipal ?')) return;
    try {
      await deleteMunicipalAgent(id);
      setAgents((current) => current.filter((agent) => agent.id !== id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossible de supprimer cet agent.');
    }
  }

  return (
    <AdminLayout>
      <section className="mx-auto max-w-5xl space-y-8">
        <AdminPageHeader
          title="Agents municipaux"
          description="Personnel habilité à valider les dossiers et administrer les accès associatifs."
        />

        <section aria-labelledby="agents-list-heading">
          <h2 id="agents-list-heading" className="sr-only">Liste des agents</h2>

          {error && <p role="alert" className="mb-4 text-sm font-semibold text-danger">{error}</p>}
          <ul className="space-y-4 p-0 list-none">
            {agents.map((agent) => (
              <li key={agent.id}>
                <AgentCard
                  agent={{
                    ...agent,
                    initials: `${agent.prenom[0] ?? ''}${agent.nom[0] ?? ''}`.toUpperCase(),
                    role: agent.roles.join(', '),
                    service: 'Administration municipale',
                  }}
                  onDelete={handleDelete}
                />
              </li>
            ))}
          </ul>
        </section>
      </section>
    </AdminLayout>
  );
}
