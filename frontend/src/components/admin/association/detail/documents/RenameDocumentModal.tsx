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
      <div className="relative w-full max-w-md rounded-[20px] border border-[var(--line)] bg-[var(--White)] p-6 sm:p-7 shadow-xl">
        <header className="border-b border-[var(--line)] pb-3">
          <h2 id="rename-doc-title" className="text-base font-bold uppercase tracking-wider text-[var(--ink)]">
            Renommer le document
          </h2>
        </header>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <p className="rounded-[10px] border border-[var(--Flush-Mahogany)]/30 bg-rose-50/70 p-3 text-xs font-semibold text-[var(--Flush-Mahogany)]">
              {error}
            </p>
          )}

          <div>
            <label
              htmlFor="rename-doc-input"
              className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1"
            >
              Intitulé du document
            </label>
            <input
              id="rename-doc-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-[10px] border border-[var(--line)] px-3.5 py-2 text-sm text-[var(--ink)] focus:border-[var(--Mosaic-Tile)] focus:outline-none"
            />
          </div>

          <footer className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--line)]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-[8px] border border-[var(--line)] px-4 py-2 text-xs font-bold text-[var(--ink)] hover:bg-[var(--paper)] transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-[8px] bg-[var(--Mosaic-Tile)] px-4 py-2 text-xs font-bold text-[var(--White)] hover:bg-[var(--moss)] transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
