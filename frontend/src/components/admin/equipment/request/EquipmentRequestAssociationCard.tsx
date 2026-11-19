import RequestInfoField from '@/components/admin/equipment/request/RequestInfoField';
import type { AdminEquipmentReservation } from '@/lib/api';

interface EquipmentRequestAssociationCardProps {
  association: AdminEquipmentReservation['association'];
}

export default function EquipmentRequestAssociationCard({ association }: EquipmentRequestAssociationCardProps) {
  const { contact } = association;

  return (
    <section aria-labelledby="request-association-title" className="rounded-card border border-line bg-white p-5 sm:p-6">
      <h2 id="request-association-title" className="text-lg font-black text-ink">
        Association
      </h2>
      <dl className="mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-2 xl:grid-cols-4">
        <RequestInfoField label="Nom">{association.nom || 'Non renseigné'}</RequestInfoField>
        <RequestInfoField label="Représentant">
          {contact.prenom} {contact.nom}
        </RequestInfoField>
        <RequestInfoField label="E-mail">{contact.email || 'Non renseigné'}</RequestInfoField>
        <RequestInfoField label="Téléphone">{contact.telephone || 'Non renseigné'}</RequestInfoField>
      </dl>
    </section>
  );
}
