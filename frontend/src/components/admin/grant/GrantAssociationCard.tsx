import RequestInfoField from '@/components/admin/equipment/request/RequestInfoField';
import type { AdminGrantDetail } from '@/lib/api';

/** Association, représentant et coordonnées bancaires pour le versement. */
export default function GrantAssociationCard({ grant }: { grant: AdminGrantDetail }) {
  const { contact } = grant;

  return (
    <section aria-labelledby="grant-association-title" className="rounded-card border border-line bg-white p-5 sm:p-6">
      <h2 id="grant-association-title" className="text-lg font-black text-ink">Association et versement</h2>
      <dl className="mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-2 xl:grid-cols-4">
        <RequestInfoField label="Nom">{grant.association.nom || 'Non renseigné'}</RequestInfoField>
        <RequestInfoField label="Représentant">
          {contact ? `${contact.prenom ?? ''} ${contact.nom ?? ''}`.trim() || 'Non renseigné' : 'Non renseigné'}
        </RequestInfoField>
        <RequestInfoField label="E-mail">{contact?.email || 'Non renseigné'}</RequestInfoField>
        <RequestInfoField label="Téléphone">{contact?.telephone || 'Non renseigné'}</RequestInfoField>
      </dl>
      <dl className="mt-4 grid gap-4 rounded-soft bg-paper p-4 sm:grid-cols-2">
        <RequestInfoField label="BIC">{grant.bic || 'Non renseigné'}</RequestInfoField>
        <RequestInfoField label="IBAN">
          <span className="font-mono">{grant.iban?.replace(/(.{4})/g, '$1 ').trim() || 'Non renseigné'}</span>
        </RequestInfoField>
      </dl>
    </section>
  );
}
