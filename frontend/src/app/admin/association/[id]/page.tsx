'use client';

import AssociationIdentityCard from '@/components/admin/association/detail/AssociationIdentityCard';
import AssociationRepresentativeCard from '@/components/admin/association/detail/AssociationRepresentativeCard';
import AssociationModulesCard from '@/components/admin/association/detail/AssociationModulesCard';
import AssociationAccountActions from '@/components/admin/association/detail/AssociationAccountActions';
import { useAssociationContext } from './AssociationContext';

export default function AssociationInformationsPage() {
  const { association, handleToggleModule, handleSuspend, handleDelete } = useAssociationContext();

  if (!association) return null;

  return (
    <section className="space-y-8" aria-label="Informations générales de l'association">
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="space-y-6 lg:col-span-7">
          <AssociationIdentityCard association={association} />
          <AssociationRepresentativeCard contact={association.contact} />
        </section>

        <section className="space-y-6 lg:col-span-5">
          <AssociationModulesCard
            permissions={association.permissions || []}
            onToggleModule={handleToggleModule}
          />
        </section>
      </section>

      <AssociationAccountActions
        nom={association.nom}
        statut={association.statut}
        onSuspend={handleSuspend}
        onDelete={handleDelete}
      />
    </section>
  );
}
