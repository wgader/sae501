'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Button from '@/components/ui/Button';
import { formFieldInputVariants, formFieldLabelVariants } from '@/components/ui/FormField';
import Notice from '@/components/ui/Notice';
import { getPublicGrantDocumentTypes } from '@/lib/api';
import { cn } from '@/lib/utils';

const FALLBACK_DOCUMENT_TYPES = ['Rapport moral', 'Bilan d’activité récente', 'Autre justificatif'];

interface GrantDocumentUploadFormProps {
  error: string;
  isUploading: boolean;
  /** Renvoie `true` lorsque le fichier a été enregistré. */
  onUpload: (file: File, documentType: string) => Promise<boolean>;
}

export default function GrantDocumentUploadForm({ error, isUploading, onUpload }: GrantDocumentUploadFormProps) {
  const [types, setTypes] = useState<string[]>(FALLBACK_DOCUMENT_TYPES);
  const [documentType, setDocumentType] = useState(FALLBACK_DOCUMENT_TYPES[0]);
  const [file, setFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  useEffect(() => {
    let active = true;
    getPublicGrantDocumentTypes()
      .then((data) => {
        if (active && data.length > 0) {
          const labels = data.map((d) => d.label);
          setTypes(labels);
          setDocumentType(labels[0]);
        }
      })
      .catch(() => {
        // Fallback silencieux sur les types statiques
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file || !(await onUpload(file, documentType))) return;
    setFile(null);
    setFileInputKey((current) => current + 1);
  };

  return (
    <form method="post" onSubmit={(event) => void handleSubmit(event)} className="rounded-soft border border-line p-5">
      <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Ajouter un justificatif</h3>
      <p className="mt-1 text-xs leading-copy text-muted">PDF, JPEG, PNG ou WebP, 10 Mo maximum par fichier.</p>
      <div className="mt-4 grid gap-5 sm:grid-cols-2">
        <label className={formFieldLabelVariants()}>
          <span>Type de document</span>
          <select value={documentType} onChange={(event) => setDocumentType(event.target.value)} className={cn(formFieldInputVariants(), 'w-full')}>
            {types.map((type) => <option key={type}>{type}</option>)}
          </select>
        </label>
        <label className={formFieldLabelVariants()}>
          <span>Fichier</span>
          <input
            key={fileInputKey}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className={cn(formFieldInputVariants(), 'w-full py-2.5 file:mr-3 file:cursor-pointer file:rounded-control file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white')}
          />
        </label>
      </div>
      {error && <Notice tone="danger" className="mt-4">{error}</Notice>}
      <div className="mt-5 flex justify-end">
        <Button type="submit" isLoading={isUploading} disabled={!file || isUploading}>
          Ajouter le fichier
        </Button>
      </div>
    </form>
  );
}
