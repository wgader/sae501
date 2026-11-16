'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { IconClose } from '@/components/ui/icons';

export const dialogVariants = cva(
  'm-auto w-full rounded-card border border-line bg-white p-0 text-ink shadow-panel backdrop:bg-ink/50 backdrop:backdrop-blur-xs',
  {
    variants: {
      size: {
        sm: 'max-w-md',
        md: 'max-w-xl',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

export interface DialogProps extends VariantProps<typeof dialogVariants> {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Modale basée sur l'élément natif <dialog> : focus piégé, fermeture par Échap et retour du
 * focus à l'élément déclencheur sont gérés par le navigateur.
 */
export default function Dialog({ open, title, description, onClose, children, footer, size }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className={cn(dialogVariants({ size }))}
    >
      <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
        <div>
          <h2 id={titleId} className="text-lg font-black text-ink">
            {title}
          </h2>
          {description && (
            <p id={descriptionId} className="mt-1 text-body-sm text-muted">
              {description}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-soft p-2 text-muted transition-colors hover:bg-paper hover:text-ink"
          aria-label="Fermer"
        >
          <IconClose className="h-4 w-4" />
        </button>
      </header>
      <div className="px-5 py-5 sm:px-6">{children}</div>
      {footer && (
        <footer className="flex flex-col-reverse gap-3 border-t border-line px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          {footer}
        </footer>
      )}
    </dialog>
  );
}
