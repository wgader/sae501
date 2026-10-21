'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import ModuleCard, { type MunicipalModule } from '@/components/admin/module/ModuleCard';

const MODULES: MunicipalModule[] = [
  {
    id: 'subvention',
    title: 'Demandes de subventions',
    tag: 'FINANCES',
    description: 'Gestion des demandes d’aides financières annuelles déposées par les associations de Feytiat.',
    status: 'Actif',
  },
  {
    id: 'salle',
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
  },
  {
    id: 'evenement',
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
                <ModuleCard module={module} />
              </li>
            ))}
          </ul>
        </section>
      </section>
    </AdminLayout>
  );
}
