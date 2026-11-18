'use client';

import { useState, type FormEvent } from 'react';
import { fieldControlVariants, fieldLabelVariants } from '@/components/admin/campaign/fieldStyles';
import Button from '@/components/ui/Button';
import { downloadPrivateDocument, type AdminEquipmentReservation } from '@/lib/api';

interface EquipmentRequestDocumentsCardProps {
  reservation: AdminEquipmentReservation;
  isSending: boolean;
  /** Envoie la demande de pièces ; résout à vrai si elle est partie. */
  onRequest: (missingFile: string, message: string) => Promise<boolean>;
}

/** Pièces déposées par l'association et demande de documents complémentaires. */
export default function EquipmentRequestDocumentsCard({ reservation, isSending, onRequest }: EquipmentRequestDocumentsCardProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [missingFile, setMissingFile] = useState('');
  const [message, setMessage] = useState('');
  const { documents } = reservation;
  const canSend = missingFile.trim().length > 0 && message.trim().length > 0 && !isSending;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSend) return;
    if (await onRequest(missingFile.trim(), message.trim())) {
      setMissingFile('');
      setMessage('');
      setIsFormOpen(false);
    }
  };

  return (
    <section aria-labelledby="request-documents-title" className="rounded-card border border-line bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="request-documents-title" className="text-lg font-black text-ink">
          Pièces annexes
        </h2>
        <Button variant="secondary" size="sm" onClick={() => setIsFormOpen((open) => !open)}>
          {isFormOpen ? 'Fermer' : 'Demander des pièces'}
        </Button>
      </div>

      {isFormOpen && (
        <form method="post" onSubmit={submit} className="mt-4 space-y-4 rounded-soft bg-paper p-4">
          <div>
            <label htmlFor="request-missing-file" className={fieldLabelVariants()}>
              Pièce attendue
            </label>
            <input
              id="request-missing-file"
              value={missingFile}
              maxLength={150}
              placeholder="Ex : attestation d’assurance"
              onChange={(event) => setMissingFile(event.target.value)}
              className={fieldControlVariants()}
            />
          </div>
          <div>
            <label htmlFor="request-documents-message" className={fieldLabelVariants()}>
              Message
            </label>
            <textarea
              id="request-documents-message"
              value={message}
              maxLength={2000}
              rows={4}
              placeholder="Précisez les éléments attendus…"
              onChange={(event) => setMessage(event.target.value)}
              className={fieldControlVariants()}
            />
          </div>
          <Button type="submit" size="sm" disabled={!canSend}>
            {isSending ? 'Envoi…' : reservation.statut === 'Complément requis' ? 'Relancer l’association' : 'Envoyer la demande'}
          </Button>
        </form>
      )}

      {documents.length === 0 ? (
        <p className="mt-4 border-t border-line pt-4 text-body-sm text-muted">Aucun justificatif déposé par l’association.</p>
      ) : (
        <ul className="mt-4 space-y-2 border-t border-line pt-4">
          {documents.map((document) => (
            <li key={document.id} className="flex flex-wrap items-center justify-between gap-3 rounded-soft bg-paper px-4 py-3">
              <div className="min-w-0">
                <p className="wrap-break-word text-body-sm font-semibold text-ink">{document.originalName}</p>
                <p className="mt-0.5 text-meta text-muted">{document.typeDocument}</p>
              </div>
              {document.fichierUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void downloadPrivateDocument(document.fichierUrl, document.originalName)}
                >
                  Télécharger
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
