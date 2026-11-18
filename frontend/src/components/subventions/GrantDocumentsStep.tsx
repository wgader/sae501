import GrantDocumentUploadForm from '@/components/subventions/GrantDocumentUploadForm';
import Button from '@/components/ui/Button';
import { getMediaUrl, type GrantDocument } from '@/lib/api';
import { formatGrantAmount, type GrantFormState } from '@/lib/grantApplication';

interface GrantDocumentsStepProps {
  form: GrantFormState;
  documents: GrantDocument[];
  error: string;
  isUploading: boolean;
  onUpload: (file: File, documentType: string) => Promise<boolean>;
  onEdit: () => void;
  onBack: () => void;
}

export default function GrantDocumentsStep({ form, documents, error, isUploading, onUpload, onEdit, onBack }: GrantDocumentsStepProps) {
  return (
    <section aria-labelledby="grant-documents-heading" className="mt-6 rounded-card border border-line bg-white p-6 shadow-xs sm:p-10">
      <header className="border-b border-line pb-5">
        <p className="text-label font-bold uppercase tracking-eyebrow text-muted">Étape 2 sur 2</p>
        <h2 id="grant-documents-heading" className="mt-1 text-2xl font-black tracking-tight text-ink">Pièces justificatives</h2>
        <p className="mt-1 text-xs text-muted">Votre dossier reste enregistré en brouillon pendant que vous ajoutez vos pièces.</p>
      </header>

      <div className="mt-6 rounded-soft bg-Misty-Rose p-5">
        <p className="font-bold text-ink">{form.intituleProjet || 'Demande sans intitulé'}</p>
        <p className="mt-1 text-sm text-ink/70">Montant demandé : {formatGrantAmount(form.montantDemande)}</p>
      </div>

      <div className="mt-6">
        <GrantDocumentUploadForm error={error} isUploading={isUploading} onUpload={onUpload} />
      </div>

      <section aria-labelledby="grant-uploaded-heading" className="mt-8">
        <h3 id="grant-uploaded-heading" className="text-sm font-bold uppercase tracking-wider text-primary">Documents ajoutés</h3>
        {documents.length > 0 ? (
          <ul className="mt-3 divide-y divide-line rounded-soft border border-line px-4">
            {documents.map((document) => (
              <li key={document.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-ink">{document.originalName}</span>
                  <span className="mt-1 block text-xs text-muted">
                    {document.typeDocument} · {(document.size / (1024 * 1024)).toFixed(2)} Mo
                  </span>
                </span>
                <a
                  href={getMediaUrl(document.fichierUrl) ?? document.fichierUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold uppercase tracking-label text-primary hover:underline"
                >
                  Consulter
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 rounded-soft border border-dashed border-line bg-paper p-4 text-sm text-muted">
            Aucun justificatif ajouté pour le moment.
          </p>
        )}
      </section>

      <footer className="mt-8 flex flex-wrap justify-between gap-3 border-t border-line pt-6">
        <Button variant="ghost" onClick={onBack}>Mes demandes</Button>
        <Button variant="secondary" onClick={onEdit}>Modifier la demande</Button>
      </footer>
    </section>
  );
}
