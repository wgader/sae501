'use client';

import { useState, type FormEvent } from 'react';
import { type AssociationDocument } from '@/lib/api';

interface RenameDocumentModalProps {
  document: AssociationDocument | null;
  onClose: () => void;
  onRename: (docId: number, nextTitle: string) => Promise<void>;
}

export default function RenameDocumentModal({
  document,
  onClose,
  onRename,
}: RenameDocumentModalProps) {
  const [title, setTitle] = useState(document?.typeDocument || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!document) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('L’intitulé du document ne peut pas être vide.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onRename(document.id, title.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de renommer le document.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rename-doc-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-md rounded-card border border-line bg-white p-6 sm:p-7 shadow-xl">
        <header className="border-b border-line pb-3">
          <h2 id="rename-doc-title" className="text-base font-bold uppercase tracking-wider text-ink">
            Renommer le document
          </h2>
        </header>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <p className="rounded-control border border-danger/30 bg-rose-50/70 p-3 text-xs font-semibold text-danger">
              {error}
            </p>
          )}

          <div>
            <label
              htmlFor="rename-doc-input"
              className="block text-xs font-bold uppercase tracking-wider text-muted mb-1"
            >
              Intitulé du document
            </label>
            <input
              id="rename-doc-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-control border border-line px-3.5 py-2 text-sm text-ink focus:border-primary focus:outline-none"
            />
          </div>

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
              className="rounded-control bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary-hover transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
