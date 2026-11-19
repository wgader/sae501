'use client';

import Button from '@/components/ui/Button';
import { downloadPrivateDocument, type GrantDocument } from '@/lib/api';

export default function GrantDocumentsCard({ documents }: { documents: GrantDocument[] }) {
  return (
    <section aria-labelledby="grant-documents-title" className="rounded-card border border-line bg-white p-5 sm:p-6">
      <h2 id="grant-documents-title" className="text-lg font-black text-ink">Pièces justificatives</h2>
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
                <Button variant="ghost" size="sm" onClick={() => void downloadPrivateDocument(document.fichierUrl, document.originalName)}>
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
