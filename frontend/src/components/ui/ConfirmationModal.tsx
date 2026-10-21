'use client';

import { useEffect, type HTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import StatusTag, { type AssociationModule } from '@/components/admin/StatusTag';
import type { AssociationStatus } from '@/lib/api';

export const confirmationModalOverlayVariants = cva(
  'fixed inset-0 z-50 flex items-center justify-center bg-[var(--ink)]/50 p-4 backdrop-blur-[2px] transition-opacity',
  {
    variants: {
      open: {
        true: 'opacity-100 pointer-events-auto',
        false: 'opacity-0 pointer-events-none',
      },
    },
    defaultVariants: {
      open: true,
    },
  },
);

export const confirmationModalCardVariants = cva(
  'relative w-full max-w-[34rem] rounded-[1.25rem] border border-[var(--line)] bg-[var(--White)] p-6 sm:p-8 shadow-2xl transition-all',
);

export interface ModuleChangeItem {
  id: AssociationModule;
  label: string;
  previousState: boolean;
  nextState: boolean;
}

export interface ConfirmationModalDataProps {
  isOpen: boolean;
  title?: string;
  associationName?: string;
  changes?: ModuleChangeItem[];
  // Mode statut d'inscription
  currentStatus?: AssociationStatus;
  targetStatus?: AssociationStatus;
  confirmVariant?: 'primary' | 'danger';
  // Compatibilité modification unique
  moduleName?: string;
  moduleId?: AssociationModule;
  willEnable?: boolean;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
}

export interface ConfirmationModalProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof confirmationModalOverlayVariants> {
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
  children?: ReactNode;
}

export default function ConfirmationModal({
  isOpen,
  title,
  associationName,
  changes,
  currentStatus,
  targetStatus,
  confirmVariant,
  moduleName,
  moduleId,
  willEnable = true,
  description,
  confirmLabel,
  cancelLabel = 'Annuler',
  isLoading = false,
  onConfirm,
  onClose,
  className,
  children,
  ...props
}: ConfirmationModalDataProps & ConfirmationModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  // Calcul du titre et des styles selon mode statut, mode unitaire ou mode par lot
  const hasBatchChanges = Boolean(changes && changes.length > 0);
  const allDeactivations = hasBatchChanges
    ? changes!.every((c) => !c.nextState)
    : !willEnable;

  const isDangerAction =
    confirmVariant === 'danger' ||
    (confirmVariant === undefined && (targetStatus === 'REFUSED' || allDeactivations));

  const defaultTitle = targetStatus
    ? targetStatus === 'VALIDATED'
      ? 'Accepter l’inscription'
      : targetStatus === 'REFUSED'
      ? 'Refuser la demande'
      : 'Remettre en attente'
    : hasBatchChanges
    ? allDeactivations
      ? 'Confirmer la désactivation des modules'
      : changes!.every((c) => c.nextState)
      ? 'Confirmer l’activation des modules'
      : 'Confirmer la modification des modules'
    : willEnable
    ? 'Confirmer l’activation du module'
    : 'Confirmer la désactivation du module';

  const finalTitle = title || defaultTitle;

  const defaultConfirmLabel = targetStatus
    ? targetStatus === 'VALIDATED'
      ? 'Confirmer l’acceptation'
      : targetStatus === 'REFUSED'
      ? 'Confirmer le refus'
      : 'Remettre en attente'
    : hasBatchChanges
    ? allDeactivations
      ? 'Confirmer la désactivation'
      : 'Confirmer les modifications'
    : willEnable
    ? 'Confirmer l’activation'
    : 'Confirmer la désactivation';

  const finalConfirmLabel = confirmLabel || defaultConfirmLabel;

  return (
    <div
      role="presentation"
      onClick={() => {
        if (!isLoading) onClose();
      }}
      className={cn(confirmationModalOverlayVariants({ open: isOpen }), className)}
      {...props}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-modal-title"
        onClick={(e) => e.stopPropagation()}
        className={cn(confirmationModalCardVariants())}
      >
        {/* En-tête */}
        <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] pb-4">
          <div>
            <h2
              id="confirmation-modal-title"
              className="mt-1 text-xl sm:text-2xl font-black uppercase tracking-tight text-[var(--ink)]"
            >
              {finalTitle}
            </h2>
          </div>
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            aria-label="Fermer la boîte de dialogue"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--paper)] hover:text-[var(--ink)] transition-colors cursor-pointer"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Corps */}
        <div className="mt-5 space-y-4 text-sm text-[var(--ink)]">
          {description && (
            <p className="text-xs leading-relaxed text-[var(--muted)]">{description}</p>
          )}

          {/* Récapitulatif : Mode statut d'inscription, mode par lot ou mode unitaire */}
          {targetStatus ? (
            <div className="space-y-3">
              {associationName && (
                <p className="font-bold uppercase text-[var(--ink)]">{associationName}</p>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3 rounded-[0.75rem] border border-[var(--line)] bg-[var(--paper)] p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[var(--ink)]">Statut de la demande</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold">
                    {currentStatus && currentStatus !== targetStatus && (
                      <>
                        <StatusTag status={currentStatus} />
                        <span className="text-[var(--muted)]">→</span>
                      </>
                    )}
                    <StatusTag status={targetStatus} />
                  </div>
                </div>
              </div>
            </div>
          ) : hasBatchChanges ? (
            <div className="space-y-3">
              {associationName && (
                <p className="font-bold uppercase text-[var(--ink)]">{associationName}</p>
              )}

              <div className="space-y-2">
                {changes!.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-[0.75rem] border border-[var(--line)] bg-[var(--paper)] p-3"
                  >
                    <div className="flex items-center gap-2">
                      <StatusTag status={item.id} />
                      <span className="text-xs font-bold text-[var(--ink)]">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold">
                      <span
                        className={
                          item.previousState
                            ? 'text-emerald-700 font-semibold'
                            : 'text-slate-400 font-semibold line-through'
                        }
                      >
                        {item.previousState ? 'Actif' : 'Inactif'}
                      </span>
                      <span className="text-[var(--muted)]">→</span>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.69rem] font-bold uppercase tracking-wider ${
                          item.nextState
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {item.nextState ? '✓ Activer' : '✕ Désactiver'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {associationName && (
                <p className="font-bold uppercase text-[var(--ink)]">{associationName}</p>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3 rounded-[0.75rem] border border-[var(--line)] bg-[var(--paper)] p-3">
                  <div className="flex items-center gap-2">
                    {moduleId && <StatusTag status={moduleId} />}
                    {moduleName && <span className="text-xs font-bold text-[var(--ink)]">{moduleName}</span>}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.69rem] font-bold uppercase tracking-wider ${
                        willEnable
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {willEnable ? '✓ Activer' : '✕ Désactiver'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {children}
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-[0.75rem] border border-[var(--line)] bg-[var(--White)] px-5 text-xs font-bold uppercase tracking-wider text-[var(--ink)] hover:bg-[var(--paper)] transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-[0.75rem] px-5 text-xs font-bold uppercase tracking-wider text-[var(--White)] transition-colors shadow-sm cursor-pointer disabled:opacity-50 ${
              isDangerAction
                ? 'bg-[var(--Flush-Mahogany)] hover:bg-[#a81c20]'
                : 'bg-[var(--Mosaic-Tile)] hover:bg-[#0f5953]'
            }`}
          >
            {isLoading && (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            <span>{finalConfirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
