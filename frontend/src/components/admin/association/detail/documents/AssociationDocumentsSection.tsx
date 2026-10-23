'use client';

import { useState } from 'react';
import {
  type Association,
  type AssociationDocument,
  uploadAssociationDocument,
  updateAssociationDocument,
  deleteAssociationDocument,
} from '@/lib/api';
import { IconUpload } from '@/components/ui/icons';
import DocumentItemCard from './DocumentItemCard';
import AddDocumentModal from './AddDocumentModal';
import RenameDocumentModal from './RenameDocumentModal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

interface AssociationDocumentsSectionProps {
  association: Association;
  onRefresh?: () => void;
}

export default function AssociationDocumentsSection({
  association,
  onRefresh,
}: AssociationDocumentsSectionProps) {
  const [documents, setDocuments] = useState<AssociationDocument[]>(
    association.documents || [],
  );

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [renamingDoc, setRenamingDoc] = useState<AssociationDocument | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<AssociationDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const handleUpload = async (file: File, typeDocument: string, isVerified: boolean) => {
    setError('');
    try {
      const created = await uploadAssociationDocument(association.id, file, typeDocument, isVerified);
      setDocuments((prev) => [created, ...prev]);
      setFeedback('Le document a été téléversé avec succès.');
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de téléverser le document.');
    }
  };

  const handleToggleVerify = async (doc: AssociationDocument) => {
    const nextState = !doc.isVerified;
    setError('');
    try {
      await updateAssociationDocument(association.id, doc.id, { isVerified: nextState });
      setDocuments((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, isVerified: nextState } : d)),
      );
      setFeedback(`Document marqué comme ${nextState ? 'vérifié' : 'à vérifier'}.`);
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de modifier l’état de vérification.');
    }
  };

  const handleRename = async (docId: number, nextTitle: string) => {
    setError('');
    try {
      await updateAssociationDocument(association.id, docId, { typeDocument: nextTitle });
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, typeDocument: nextTitle } : d)),
      );
      setFeedback('Document renommé avec succès.');
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de renommer le document.');
    }
  };

  const handleDelete = async () => {
    if (!deletingDoc) return;
    setIsDeleting(true);
    setError('');
    try {
      await deleteAssociationDocument(association.id, deletingDoc.id);
      setDocuments((prev) => prev.filter((d) => d.id !== deletingDoc.id));
      setFeedback('Document supprimé du dossier.');
      setDeletingDoc(null);
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de supprimer le document.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePreview = async (doc: AssociationDocument) => {
    setError('');
    const fullUrl = doc.fichierUrl.startsWith('http') || doc.fichierUrl.startsWith('blob:')
      ? doc.fichierUrl
      : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost'}${doc.fichierUrl}`;

    if (doc.fichierUrl.startsWith('blob:')) {
      window.open(fullUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    try {
      const res = await fetch(fullUrl, { method: 'HEAD' });
      if (!res.ok) {
        setError(`Le document « ${doc.typeDocument} » n'est pas disponible ou introuvable sur le serveur.`);
        return;
      }
      window.open(fullUrl, '_blank', 'noopener,noreferrer');
    } catch {
      window.open(fullUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDownload = async (doc: AssociationDocument) => {
    setError('');
    const fullUrl = doc.fichierUrl.startsWith('http') || doc.fichierUrl.startsWith('blob:')
      ? doc.fichierUrl
      : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost'}${doc.fichierUrl}`;

    if (doc.fichierUrl.startsWith('blob:')) {
      const a = window.document.createElement('a');
      a.href = fullUrl;
      a.download = doc.typeDocument;
      a.click();
      return;
    }

    try {
      const res = await fetch(fullUrl);
      if (!res.ok) {
        setError(`Impossible de télécharger « ${doc.typeDocument} » : le document est introuvable sur le serveur.`);
        return;
      }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = blobUrl;
      a.download = doc.typeDocument;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      setError(`Impossible de télécharger « ${doc.typeDocument} » : fichier inaccessible.`);
    }
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-ink">
            Documents de l’association
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            Les pièces disponibles dans le dossier de {association.nom}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-pill bg-paper border border-line px-3 py-1 text-xs font-semibold text-muted">
            {documents.length} document{documents.length > 1 ? 's' : ''}
          </span>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-control bg-primary px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-primary-hover cursor-pointer"
          >
            <IconUpload className="h-3.5 w-3.5" />
            <span>Ajouter un document</span>
          </button>
        </div>
      </header>

      {feedback && (
        <p
          className="rounded-control border border-primary/30 bg-primary-soft/50 p-3.5 text-xs font-semibold text-primary"
          role="status"
        >
          {feedback}
        </p>
      )}

      {error && (
        <p
          className="rounded-control border border-danger/30 bg-rose-50/70 p-3.5 text-xs font-semibold text-danger"
          role="alert"
        >
          {error}
        </p>
      )}

      {documents.length === 0 ? (
        <section className="rounded-card border border-line bg-white p-12 text-center">
          <p className="text-sm font-bold text-ink">Aucun document dans le dossier</p>
          <p className="mt-1 text-xs text-muted">
            Téléversez un premier justificatif pour cette association.
          </p>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-control bg-primary px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-primary-hover cursor-pointer"
          >
            <IconUpload className="h-3.5 w-3.5" />
            <span>Téléverser une pièce</span>
          </button>
        </section>
      ) : (
        <ul className="space-y-4 p-0 list-none">
          {documents.map((doc) => (
            <li key={doc.id}>
              <DocumentItemCard
                document={doc}
                onToggleVerify={handleToggleVerify}
                onRename={(d) => setRenamingDoc(d)}
                onDelete={(d) => setDeletingDoc(d)}
                onPreview={handlePreview}
                onDownload={handleDownload}
              />
            </li>
          ))}
        </ul>
      )}

      <p className="border-t border-line pt-4 text-xs text-muted">
        Les documents sont consultables et téléchargeables depuis cette rubrique.
      </p>

      {/* Modal d'ajout de document */}
      <AddDocumentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onUpload={handleUpload}
        associationNom={association.nom}
      />

      {/* Modal de renommage */}
      <RenameDocumentModal
        document={renamingDoc}
        onClose={() => setRenamingDoc(null)}
        onRename={handleRename}
      />

      {/* Modal de confirmation de suppression */}
      {deletingDoc && (
        <ConfirmationModal
          isOpen={true}
          title="Supprimer la pièce justificative ?"
          description={`Êtes-vous sûr de vouloir supprimer le document « ${deletingDoc.typeDocument} » du dossier de l’association ?`}
          confirmLabel="Supprimer"
          cancelLabel="Annuler"
          confirmVariant="danger"
          isLoading={isDeleting}
          onConfirm={handleDelete}
          onClose={() => setDeletingDoc(null)}
        />
      )}
    </section>
  );
}
