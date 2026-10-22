'use client';

import AssociationDocumentsSection from '@/components/admin/association/detail/documents/AssociationDocumentsSection';
import { useAssociationContext } from '../AssociationContext';

export default function AssociationDocumentsPage() {
  const { association, loadData } = useAssociationContext();

  if (!association) return null;

  return (
    <AssociationDocumentsSection
      key={association.documents?.map((d) => `${d.id}-${d.typeDocument}-${d.isVerified}`).join(',') ?? 'empty'}
      association={association}
      onRefresh={loadData}
    />
  );
}
