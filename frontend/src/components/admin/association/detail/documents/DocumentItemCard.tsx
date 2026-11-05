'use client';

import { type AssociationDocument } from '@/lib/api';
import {
  IconPdfFile,
  IconImageFile,
  IconGenericFile,
  IconCheck,
  IconEye,
  IconDownload,
  IconEdit,
  IconTrash,
} from '@/components/ui/icons';

interface DocumentItemCardProps {
  document: AssociationDocument;
  onToggleVerify: (doc: AssociationDocument) => void;
  onRename: (doc: AssociationDocument) => void;
  onDelete: (doc: AssociationDocument) => void;
  onPreview: (doc: AssociationDocument) => void;
  onDownload?: (doc: AssociationDocument) => void;
  disabled?: boolean;
}

export default function DocumentItemCard({
  document,
  onToggleVerify,
  onRename,
  onDelete,
  onPreview,
  onDownload,
  disabled = false,
}: DocumentItemCardProps) {
  const formattedSize =
    document.size > 1024 * 1024
      ? `${(document.size / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`
      : `${Math.round(document.size / 1024)} Ko`;

  const isPdf =
    document.mimeType?.includes('pdf') ||
    document.typeDocument.toLowerCase().endsWith('.pdf') ||
    document.originalName?.toLowerCase().endsWith('.pdf');

  const isImage =
    document.mimeType?.startsWith('image/') ||
    /\.(jpe?g|png|webp|gif|svg)$/i.test(document.typeDocument) ||
    /\.(jpe?g|png|webp|gif|svg)$/i.test(document.originalName || '');

  const formatLabel = isPdf
    ? 'PDF'
    : isImage
    ? (document.mimeType?.split('/')[1]?.toUpperCase() || 'IMAGE')
    : 'DOC';

  const FileIcon = isPdf ? IconPdfFile : isImage ? IconImageFile : IconGenericFile;

  return (
    <article className="group flex flex-col gap-4 rounded-card border border-line bg-paper p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 transition-all hover:border-primary/30 hover:shadow-xs">
      <div className="flex items-center gap-4 min-w-0">
        <span className="shrink-0">
          <FileIcon className="h-10 w-9 text-primary" />
        </span>

        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-ink">
            {document.typeDocument}
          </h3>
          <p className="mt-0.5 text-xs text-muted">
            {formatLabel} · {formattedSize}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Badge vérification cliquable */}
        <button
          type="button"
          onClick={() => onToggleVerify(document)}
          disabled={disabled}
          title="Cliquer pour modifier l'état de vérification"
          className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-xs font-bold transition cursor-pointer ${
            document.isVerified
              ? 'bg-primary-soft text-primary border border-primary/30 hover:bg-primary-soft/80'
              : 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
          }`}
        >
          {document.isVerified && <IconCheck className="h-3 w-3 stroke-[3]" />}
          <span>{document.isVerified ? 'Vérifié' : 'À vérifier'}</span>
        </button>

        {/* Consulter */}
        <button
          type="button"
          onClick={() => onPreview(document)}
          className="inline-flex items-center gap-1.5 rounded-control px-2.5 py-1.5 text-xs font-bold text-primary transition hover:bg-primary-soft/50 cursor-pointer"
        >
          <IconEye className="h-4 w-4" />
          <span>Consulter</span>
        </button>

        {/* Télécharger */}
        <button
          type="button"
          onClick={() => onDownload?.(document)}
          className="inline-flex items-center gap-1.5 rounded-control border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink shadow-xs transition hover:bg-paper cursor-pointer"
        >
          <IconDownload className="h-3.5 w-3.5 text-primary" />
          <span>Télécharger</span>
        </button>

        {/* Renommer */}
        <button
          type="button"
          onClick={() => onRename(document)}
          disabled={disabled}
          title="Renommer le document"
          className="flex h-8 w-8 items-center justify-center rounded-control border border-line bg-white text-muted transition hover:text-primary hover:border-primary cursor-pointer"
        >
          <IconEdit className="h-3.5 w-3.5" />
          <span className="sr-only">Renommer</span>
        </button>

        {/* Supprimer */}
        <button
          type="button"
          onClick={() => onDelete(document)}
          disabled={disabled}
          title="Supprimer le document"
          className="flex h-8 w-8 items-center justify-center rounded-control border border-line bg-white text-muted transition hover:text-danger hover:border-danger hover:bg-rose-50 cursor-pointer"
        >
          <IconTrash className="h-3.5 w-3.5" />
          <span className="sr-only">Supprimer</span>
        </button>
      </div>
    </article>
  );
}
