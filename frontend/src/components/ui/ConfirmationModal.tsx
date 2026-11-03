'use client';

import { useEffect, type HTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import StatusTag, { type AssociationModule } from '@/components/admin/StatusTag';
import type { AssociationStatus } from '@/lib/api';
import { IconChevronRight } from '@/components/ui/icons';

export const confirmationModalOverlayVariants = cva(
  'fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-xs transition-opacity',
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
  'relative w-full max-w-[34rem] rounded-card border border-line bg-white p-6 sm:p-8 shadow-2xl transition-all',
);

export const confirmationModalConfirmButtonVariants = cva(
  'inline-flex h-11 items-center justify-center gap-2 rounded-soft px-5 text-xs font-bold uppercase tracking-label text-white transition-colors shadow-xs cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary hover:bg-primary-hover active:bg-primary-hover',
        danger: 'bg-danger hover:bg-danger/90 active:bg-danger/90',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  },
);

export const confirmationModalCancelButtonVariants = cva(
  'inline-flex h-11 items-center justify-center rounded-soft border border-line bg-white px-5 text-xs font-bold uppercase tracking-label text-ink hover:bg-paper transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
);

export const moduleActionBadgeVariants = cva(
  'inline-flex items-center rounded-pill px-2.5 py-0.5 text-caption font-bold uppercase tracking-label',
  {
    variants: {
      action: {
        enable: 'bg-primary-soft text-primary border border-primary/20',
        disable: 'bg-danger/10 text-danger border border-danger/20',
      },
    },
    defaultVariants: {
      action: 'enable',
    },
  },
);

export const modulePreviousStateVariants = cva('font-semibold', {
  variants: {
    active: {
      true: 'text-primary',
      false: 'text-muted line-through',
    },
  },
  defaultVariants: {
    active: true,
  },
});

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

interface StatusChangeSummaryProps {
  associationName?: string;
  currentStatus?: AssociationStatus;
  targetStatus: AssociationStatus;
}

function StatusChangeSummary({
  associationName,
  currentStatus,
  targetStatus,
}: StatusChangeSummaryProps) {
  return (
    <section className="space-y-3" aria-label="Récapitulatif du statut">
      {associationName && (
        <p className="font-bold uppercase text-ink">{associationName}</p>
      )}

      <div className="flex items-center justify-between gap-3 rounded-soft border border-line bg-paper p-3">
        <span className="text-xs font-bold text-ink">Statut de la demande</span>

        <div className="flex items-center gap-2 text-xs font-bold">
          {currentStatus && currentStatus !== targetStatus && (
            <>
              <StatusTag status={currentStatus} />
              <IconChevronRight className="h-3 w-3 text-muted" aria-hidden="true" />
            </>
          )}
          <StatusTag status={targetStatus} />
        </div>
      </div>
    </section>
  );
}

interface BatchModuleChangesSummaryProps {
  associationName?: string;
  changes: ModuleChangeItem[];
}

function BatchModuleChangesSummary({
  associationName,
  changes,
}: BatchModuleChangesSummaryProps) {
  return (
    <section className="space-y-3" aria-label="Récapitulatif des modules modifiés">
      {associationName && (
        <p className="font-bold uppercase text-ink">{associationName}</p>
      )}

      <ul className="space-y-2">
        {changes.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-soft border border-line bg-paper p-3"
          >
            <div className="flex items-center gap-2">
              <StatusTag status={item.id} />
              <span className="text-xs font-bold text-ink">{item.label}</span>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold">
              <span className={cn(modulePreviousStateVariants({ active: item.previousState }))}>
                {item.previousState ? 'Actif' : 'Inactif'}
              </span>
              <IconChevronRight className="h-3 w-3 text-muted" aria-hidden="true" />
              <span
                className={cn(
                  moduleActionBadgeVariants({ action: item.nextState ? 'enable' : 'disable' }),
                )}
              >
                {item.nextState ? '✓ Activer' : '✕ Désactiver'}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

interface SingleModuleChangeSummaryProps {
  associationName?: string;
  moduleId?: AssociationModule;
  moduleName?: string;
  willEnable: boolean;
}

function SingleModuleChangeSummary({
  associationName,
  moduleId,
  moduleName,
  willEnable,
}: SingleModuleChangeSummaryProps) {
  return (
    <section className="space-y-3" aria-label="Récapitulatif du module">
      {associationName && (
        <p className="font-bold uppercase text-ink">{associationName}</p>
      )}

      <div className="flex items-center justify-between gap-3 rounded-soft border border-line bg-paper p-3">
        <div className="flex items-center gap-2">
          {moduleId && <StatusTag status={moduleId} />}
          {moduleName && <span className="text-xs font-bold text-ink">{moduleName}</span>}
        </div>
        <div className="flex items-center gap-2 text-xs font-bold">
          <span
            className={cn(
              moduleActionBadgeVariants({ action: willEnable ? 'enable' : 'disable' }),
            )}
          >
            {willEnable ? '✓ Activer' : '✕ Désactiver'}
          </span>
        </div>
      </div>
    </section>
  );
}

function resolveModalTitle({
  title,
  targetStatus,
  hasBatchChanges,
  allDeactivations,
  allActivations,
  hasModuleAction,
  willEnable,
}: {
  title?: string;
  targetStatus?: AssociationStatus;
  hasBatchChanges: boolean;
  allDeactivations: boolean;
  allActivations: boolean;
  hasModuleAction: boolean;
  willEnable: boolean;
}): string {
  if (title) return title;

  if (targetStatus === 'VALIDATED') return 'Accepter l’inscription';
  if (targetStatus === 'REFUSED') return 'Refuser la demande';
  if (targetStatus === 'PENDING_VALIDATION') return 'Remettre en attente';

  if (hasBatchChanges) {
    if (allDeactivations) return 'Confirmer la désactivation des modules';
    if (allActivations) return 'Confirmer l’activation des modules';
    return 'Confirmer la modification des modules';
  }

  if (hasModuleAction) {
    return willEnable ? 'Confirmer l’activation du module' : 'Confirmer la désactivation du module';
  }

  return 'Confirmation';
}

function resolveConfirmLabel({
  confirmLabel,
  targetStatus,
  hasBatchChanges,
  allDeactivations,
  hasModuleAction,
  willEnable,
}: {
  confirmLabel?: string;
  targetStatus?: AssociationStatus;
  hasBatchChanges: boolean;
  allDeactivations: boolean;
  hasModuleAction: boolean;
  willEnable: boolean;
}): string {
  if (confirmLabel) return confirmLabel;

  if (targetStatus === 'VALIDATED') return 'Confirmer l’acceptation';
  if (targetStatus === 'REFUSED') return 'Confirmer le refus';
  if (targetStatus === 'PENDING_VALIDATION') return 'Remettre en attente';

  if (hasBatchChanges) {
    return allDeactivations ? 'Confirmer la désactivation' : 'Confirmer les modifications';
  }

  if (hasModuleAction) {
    return willEnable ? 'Confirmer l’activation' : 'Confirmer la désactivation';
  }

  return 'Confirmer';
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

  const hasBatchChanges = Boolean(changes && changes.length > 0);
  const hasModuleAction = Boolean(moduleId || moduleName);
  const allDeactivations = hasBatchChanges ? changes!.every((c) => !c.nextState) : !willEnable;
  const allActivations = hasBatchChanges ? changes!.every((c) => c.nextState) : willEnable;

  const isDangerAction =
    confirmVariant === 'danger' ||
    (confirmVariant === undefined &&
      (targetStatus === 'REFUSED' || (hasModuleAction && !willEnable)));

  const actionVariant: 'primary' | 'danger' = isDangerAction ? 'danger' : 'primary';

  const finalTitle = resolveModalTitle({
    title,
    targetStatus,
    hasBatchChanges,
    allDeactivations,
    allActivations,
    hasModuleAction,
    willEnable,
  });

  const finalConfirmLabel = resolveConfirmLabel({
    confirmLabel,
    targetStatus,
    hasBatchChanges,
    allDeactivations,
    hasModuleAction,
    willEnable,
  });

  const renderSummary = () => {
    if (targetStatus) {
      return (
        <StatusChangeSummary
          associationName={associationName}
          currentStatus={currentStatus}
          targetStatus={targetStatus}
        />
      );
    }

    if (hasBatchChanges && changes) {
      return (
        <BatchModuleChangesSummary
          associationName={associationName}
          changes={changes}
        />
      );
    }

    if (hasModuleAction) {
      return (
        <SingleModuleChangeSummary
          associationName={associationName}
          moduleId={moduleId}
          moduleName={moduleName}
          willEnable={willEnable}
        />
      );
    }

    return null;
  };

  return (
    <div
      role="presentation"
      onClick={() => {
        if (!isLoading) onClose();
      }}
      className={cn(confirmationModalOverlayVariants({ open: isOpen }), className)}
      {...props}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-modal-title"
        onClick={(e) => e.stopPropagation()}
        className={cn(confirmationModalCardVariants())}
      >
        {/* En-tête sémantique */}
        <header className="flex items-start justify-between gap-4 border-b border-line pb-4">
          <h2
            id="confirmation-modal-title"
            className="mt-1 text-xl sm:text-2xl font-black uppercase tracking-heading text-ink"
          >
            {finalTitle}
          </h2>

          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            aria-label="Fermer la boîte de dialogue"
            className="flex h-8 w-8 items-center justify-center rounded-pill text-muted hover:bg-paper hover:text-ink transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        {/* Corps */}
        <div className="mt-5 space-y-4 text-sm text-ink">
          {description && (
            <p className="text-xs leading-relaxed text-muted">{description}</p>
          )}

          {renderSummary()}

          {children}
        </div>

        {/* Pied d'actions sémantique */}
        <footer className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className={cn(confirmationModalCancelButtonVariants())}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={cn(confirmationModalConfirmButtonVariants({ variant: actionVariant }))}
          >
            {isLoading && (
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth={4}
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            )}
            <span>{finalConfirmLabel}</span>
          </button>
        </footer>
      </section>
    </div>
  );
}
