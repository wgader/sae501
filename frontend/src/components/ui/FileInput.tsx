'use client';

import { useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from 'react';

const ACCEPTED_FILE_TYPES = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.webp';

const CloudIcon = () => (
  <svg className="mx-auto mb-2 size-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const PdfIcon = () => (
  <div className="flex size-10 shrink-0 items-center justify-center rounded bg-danger text-xs font-bold text-white">
    DOC
  </div>
);

const CheckCircleIcon = () => (
  <svg className="h-4 w-4 shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const units = ['Octets', 'Ko', 'Mo', 'Go'];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${parseFloat((bytes / 1024 ** unitIndex).toFixed(1))} ${units[unitIndex]}`;
};

type FileUploaderProps = {
  title: string;
  required?: boolean;
  highlighted?: boolean;
  file: File | null;
  error: string | null;
  onChange: (file: File | null) => void;
};

export default function FileUploader({
  title,
  required = false,
  highlighted = false,
  file,
  error,
  onChange,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.files?.[0] ?? null);
    event.target.value = '';
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) onChange(droppedFile);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      inputRef.current?.click();
    }
  };

  if (file) {
    return (
      <div className="flex h-full flex-col gap-2">
        <label className="text-xs font-bold text-ink">
          {title} {required && '*'}
        </label>
        <div className="flex h-full flex-col justify-between rounded-lg border border-primary bg-primary-soft p-4 shadow-sm transition-all">
          <div className="flex items-start justify-between gap-4 overflow-hidden">
            <div className="flex items-center gap-3 overflow-hidden">
              <PdfIcon />
              <div className="overflow-hidden">
                <p className="truncate text-sm font-bold text-ink" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-muted">{formatFileSize(file.size)} - à l&apos;instant</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-green-600 px-2.5 py-1 text-caption font-bold text-white">
              <CheckCircleIcon /> Validé
            </div>
          </div>

          {error && <p className="mt-2 text-caption font-bold text-danger">{error}</p>}

          <div className="mt-4 flex items-center justify-end gap-2 text-xs font-bold text-primary">
            <label className="cursor-pointer hover:underline">
              Remplacer
              <input
                type="file"
                className="hidden"
                accept={ACCEPTED_FILE_TYPES}
                onChange={handleFileChange}
              />
            </label>
            <span className="text-line">|</span>
            <button type="button" onClick={() => onChange(null)} className="text-danger hover:underline">
              Supprimer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-ink">
          {title} {required && '*'}
        </label>
        {!required && <span className="text-caption text-muted">(Optionnel)</span>}
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label={`Ajouter un fichier : ${title}`}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative flex h-full min-h-35 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          isDragging
            ? 'border-primary bg-primary-soft'
            : error
              ? 'border-danger bg-red-50'
              : highlighted && required
                ? 'border-amber-600 bg-amber-50 hover:bg-amber-100'
                : 'border-line bg-paper/50 hover:bg-paper'
        }`}
      >
        <input
          type="file"
          ref={inputRef}
          className="hidden"
          accept={ACCEPTED_FILE_TYPES}
          onClick={(event) => event.stopPropagation()}
          onChange={handleFileChange}
        />
        <CloudIcon />
        <p className="mb-2 text-xs text-ink">
          {required ? 'Glissez votre fichier ici' : 'Facultatif - glissez ou cliquez'}
        </p>
        {required && <p className="mb-2 text-xs text-muted">ou</p>}
        <span className="mb-2 inline-block rounded-full border border-line bg-white px-4 py-1.5 text-xs font-bold text-ink shadow-sm transition-colors hover:bg-gray-50">
          Parcourir mes fichiers
        </span>
        <p className="text-caption text-muted">PDF, Word ou image - max 5 Mo</p>
      </div>

      {error ? (
        <p className="text-caption font-bold text-danger">{error}</p>
      ) : highlighted && required ? (
        <p className="flex items-center gap-1.5 text-caption font-bold text-amber-600">
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          Document requis
        </p>
      ) : null}
    </div>
  );
}
