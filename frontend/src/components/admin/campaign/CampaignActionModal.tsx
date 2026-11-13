import { useEffect, useRef } from 'react';
import type { Campaign } from '@/lib/api/types';

interface CampaignActionModalProps {
  isOpen: boolean;
  type: 'open' | 'close' | null;
  campaign: Campaign | null;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function CampaignActionModal({
  isOpen,
  type,
  campaign,
  isLoading,
  onClose,
  onConfirm,
}: CampaignActionModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen || !type || !campaign) return null;

  const isOpenAction = type === 'open';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-action-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={() => {
          if (!isLoading) onClose();
        }}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        ref={modalRef}
        className="relative w-full max-w-lg rounded-2xl bg-white p-6 sm:p-8 shadow-2xl transition-all"
      >
        <div className="flex items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
              isOpenAction ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}
          >
            {isOpenAction ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </div>

          <div className="flex-1">
            <h3 id="modal-action-title" className="text-lg font-bold text-ink">
              {isOpenAction ? 'Ouvrir la campagne par anticipation ?' : 'Clôturer la campagne ferme ?'}
            </h3>
            <p className="mt-2 text-sm text-muted">
              {isOpenAction ? (
                <>
                  Vous êtes sur le point d&apos;activer la campagne{' '}
                  <strong className="text-ink">{campaign.seasonLabel}</strong> avant son échéance programmée. Le guichet
                  de dépôt des vœux annuels deviendra immédiatement accessible aux associations habilitées.
                </>
              ) : (
                <>
                  Vous êtes sur le point de clôturer la campagne{' '}
                  <strong className="text-ink">{campaign.seasonLabel}</strong>. Dès confirmation, le formulaire de dépôt
                  de vœux annuel sera automatiquement verrouillé et aucune nouvelle demande ne pourra être soumise.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="inline-flex justify-center rounded-control border border-border bg-white px-4 py-2.5 text-sm font-semibold text-ink shadow-xs hover:bg-surface disabled:opacity-50 cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`inline-flex justify-center rounded-control px-4 py-2.5 text-sm font-bold text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer ${
              isOpenAction
                ? 'bg-primary hover:bg-primary-hover'
                : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Traitement en cours...
              </span>
            ) : isOpenAction ? (
              'Confirmer l’ouverture'
            ) : (
              'Confirmer la clôture'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

