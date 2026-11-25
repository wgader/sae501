'use client';

import ScheduleHistoryPanel from '@/components/schedule-history/ScheduleHistoryPanel';
import { routes } from '@/lib/routes';
import { useAssociationContext } from '../AssociationContext';

/** Onglet Historique de la fiche : bilan des salles et du matériel de l’association choisie. */
export default function AssociationHistoriquePage() {
  const { id } = useAssociationContext();

  return (
    <ScheduleHistoryPanel
      associationId={id}
      annexHref={(attribution) => routes.adminAssociationRequestAnnexes(id, attribution.type, attribution.id)}
    />
  );
}
