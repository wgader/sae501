'use client';

import { useState, useRef, type ChangeEvent, type FormEvent } from 'react';
import { IconUpload } from '@/components/ui/icons';

interface AddDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, typeDocument: string, isVerified: boolean) => Promise<void>;
  associationNom: string;
}

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo

export default function AddDocumentModal({
  isOpen,
  onClose,
  onUpload,
  associationNom,
}: AddDocumentModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [isVerified, setIsVerified] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setError('Format non supporté. Veuillez sélectionner un fichier PDF, JPG ou PNG.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('Taille trop volumineuse. Le fichier ne doit pas dépasser 10 Mo.');
      return;
    }

    setSelectedFile(file);
    if (!title) {
      setTitle(file.name);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Veuillez sélectionner un fichier à téléverser.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onUpload(selectedFile, title.trim() || selectedFile.name, isVerified);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec du téléversement du document.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-doc-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-lg rounded-card border border-line bg-white p-6 sm:p-8 shadow-xl">
        <header className="border-b border-line pb-4">
          <span className="text-label font-bold uppercase tracking-kicker text-primary">
            Administration des pièces justificatives
          </span>
          <h2 id="add-doc-title" className="mt-1 text-lg font-black uppercase text-ink">
            Ajouter un document
          </h2>
          <p className="mt-1 text-xs text-muted">
            Dossier de l’association {associationNom}
          </p>
        </header>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {error && (
            <p className="rounded-control border border-danger/30 bg-rose-50/70 p-3 text-xs font-semibold text-danger">
              {error}
            </p>
          )}

          <div>
            <label
              htmlFor="doc-file-input"
              className="block text-xs font-bold uppercase tracking-wider text-ink mb-2"
            >
              Fichier source (PDF, PNG, JPG · Max 10 Mo) *
            </label>
            <input
              id="doc-file-input"
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={handleFileChange}
              required
              className="block w-full text-xs text-muted file:mr-3 file:rounded-control file:border-0 file:bg-primary-soft file:px-3 file:py-2 file:text-xs file:font-bold file:text-primary hover:file:bg-primary-soft/70 cursor-pointer"
            />
            {selectedFile && (
              <p className="mt-1.5 text-xs text-primary font-semibold">
                Fichier sélectionné : {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} Ko)
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="doc-title-input"
              className="block text-xs font-bold uppercase tracking-wider text-ink mb-1"
            >
              Intitulé du document affiché
            </label>
            <input
              id="doc-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Statuts de l'association.pdf"
              className="w-full rounded-control border border-line px-3.5 py-2 text-sm text-ink focus:border-primary focus:outline-none"
            />
          </div>

          <label className="flex items-center gap-2.5 text-xs font-semibold text-ink cursor-pointer">
            <input
              type="checkbox"
              checked={isVerified}
              onChange={(e) => setIsVerified(e.target.checked)}
              className="h-4 w-4 rounded text-primary focus:ring-primary"
            />
            <span>Marquer le document comme vérifié d’office</span>
          </label>

          <footer className="flex items-center justify-end gap-3 pt-3 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-control border border-line px-4 py-2 text-xs font-bold text-ink hover:bg-paper transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-control bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary-hover transition disabled:opacity-50 cursor-pointer"
            >
              <IconUpload className="h-4 w-4" />
              <span>{loading ? 'Téléversement...' : 'Ajouter au dossier'}</span>
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
