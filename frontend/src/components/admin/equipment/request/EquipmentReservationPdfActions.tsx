'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { downloadEquipmentReservationPdf, type AdminEquipmentReservation } from '@/lib/api';

/** Statuts pour lesquels la mairie peut imprimer un bon provisoire avant sa décision. */
const PROVISIONAL_STATUSES = ['En attente', 'En cours de traitement', 'Complément requis'];
/** Statuts pour lesquels le bon officiel existe. */
const OFFICIAL_STATUSES = ['Validée', 'Clôturée'];

interface EquipmentReservationPdfActionsProps {
  reservation: AdminEquipmentReservation;
  onError: (message: string) => void;
}

/** Téléchargement du bon de réservation : officiel une fois validé, provisoire tant que la demande est ouverte. */
export default function EquipmentReservationPdfActions({ reservation, onError }: EquipmentReservationPdfActionsProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const status: string = reservation.statut;
  const isOfficial = OFFICIAL_STATUSES.includes(status);
  const isProvisional = PROVISIONAL_STATUSES.includes(status);

  if (!reservation.id || (!isOfficial && !isProvisional)) return null;
  const reservationId = reservation.id;

  async function handleDownload() {
    setIsDownloading(true);
    try {
      await downloadEquipmentReservationPdf(reservationId, isProvisional);
    } catch (error: unknown) {
      onError(error instanceof Error ? error.message : 'Impossible de télécharger le bon de réservation.');
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <Button
      type="button"
      variant={isOfficial ? 'primary' : 'secondary'}
      isLoading={isDownloading}
      onClick={() => void handleDownload()}
    >
      {isOfficial ? 'Télécharger le bon officiel' : 'Télécharger le PDF provisoire'}
    </Button>
  );
}
