import GrantDocumentUploadForm from '@/components/subventions/GrantDocumentUploadForm';
import Button from '@/components/ui/Button';
import { getMediaUrl, type GrantDocument } from '@/lib/api';
import { formatGrantAmount, type GrantFormState } from '@/lib/grantApplication';

interface GrantDocumentsStepProps {
  form: GrantFormState;
  documents: GrantDocument[];
  error: string;
  isUploading: boolean;
  isSubmitting: boolean;
  onUpload: (file: File, documentType: string) => Promise<boolean>;
  onEdit: () => void;
  onBack: () => void;
  onSubmit: () => void;
}

export default function GrantDocumentsStep({
  form,
  documents,
  error,
  isUploading,
  isSubmitting,
  onUpload,
  onEdit,
  onBack,
  onSubmit,
}: GrantDocumentsStepProps) {
  const canSubmit = documents.length > 0;

  return (
    <section aria-labelledby="grant-documents-heading" className="mt-6 rounded-card border border-line bg-white p-6 shadow-xs sm:p-10">
      <header className="border-b border-line pb-5">
        <p className="text-label font-bold uppercase tracking-eyebrow text-muted">Étape 2 sur 2</p>
        <h2 id="grant-documents-heading" className="mt-1 text-2xl font-black tracking-tight text-ink">Pièces justificatives</h2>
        <p className="mt-1 text-xs text-muted">Le dossier reste en brouillon tant que vous ne l’avez pas transmis à la mairie.</p>
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

      <section aria-labelledby="grant-submit-heading" className="mt-8 rounded-soft border border-line bg-paper p-5">
        <h3 id="grant-submit-heading" className="text-sm font-bold text-ink">Transmettre le dossier</h3>
        <p className="mt-1 text-xs text-muted">
          {canSubmit
            ? 'Une fois transmis, le dossier passe « En attente » et ne peut plus être modifié. Vous serez prévenu par e-mail de la décision.'
            : 'Ajoutez au moins une pièce justificative, par exemple le formulaire Cerfa complété, pour pouvoir transmettre le dossier.'}
        </p>
      </section>

      <footer className="mt-8 flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:flex-wrap sm:justify-between">
        <Button variant="ghost" onClick={onBack} className="w-full sm:w-auto">Mes demandes</Button>
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <Button variant="secondary" onClick={onEdit} disabled={isSubmitting} className="w-full sm:w-auto">Modifier la demande</Button>
          <Button onClick={onSubmit} isLoading={isSubmitting} disabled={!canSubmit || isUploading} className="w-full sm:w-auto">
            Transmettre à la mairie
          </Button>
        </div>
      </footer>
    </section>
  );
}
