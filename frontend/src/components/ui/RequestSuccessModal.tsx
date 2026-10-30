'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

type RequestSuccessModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  followHref?: string;
};

export default function RequestSuccessModal({
  isOpen,
  onClose,
  title = 'Votre demande a bien été transmise',
  description = 'Votre demande a bien été transmise aux services de la mairie. Elle est actuellement en cours d’instruction.',
  followHref = '/historique',
}: RequestSuccessModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-xs"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="relative w-full max-w-2xl rounded-panel bg-white p-8 shadow-2xl sm:p-12"
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-success-title"
        aria-describedby="request-success-description"
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-control w-control items-center justify-center rounded-pill bg-paper text-ink transition-colors hover:bg-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          aria-label="Fermer la confirmation"
        >
          <span className="text-2xl font-light leading-none" aria-hidden="true">×</span>
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-pill bg-accent" aria-hidden="true">
            <span className="text-3xl font-bold text-primary">✓</span>
          </div>
          <p className="mt-5 text-label font-bold uppercase tracking-section text-primary">
            Demande transmise
          </p>
          <h2 id="request-success-title" className="mt-4 max-w-xl text-3xl font-black leading-tight tracking-heading text-black sm:text-4xl">
            {title}
          </h2>
          <p id="request-success-description" className="mt-5 max-w-xl text-body leading-copy text-muted">
            {description}
          </p>
          <p className="mt-4 text-sm font-bold text-ink">
            Un e-mail récapitulatif vous a été envoyé.
          </p>

          <div className="mt-8 grid w-full gap-3 sm:grid-cols-2">
            <Link
              href="/"
              className={cn(
                'inline-flex min-h-control items-center justify-center rounded-control border border-black px-5 text-xs font-bold uppercase tracking-label text-black transition-colors hover:bg-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
              )}
              onClick={onClose}
            >
              Retour à l&apos;accueil
            </Link>
            <Link
              href={followHref}
              className="inline-flex min-h-control items-center justify-center rounded-control border border-primary bg-primary px-5 text-xs font-bold uppercase tracking-label text-white transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              onClick={onClose}
            >
              Suivre ma demande
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
