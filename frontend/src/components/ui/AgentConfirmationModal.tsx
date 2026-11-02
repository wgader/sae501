'use client';

import { useEffect } from 'react';
import StatusTag, { type AssociationModule } from '@/components/admin/StatusTag';

export interface AgentConfirmationItem {
  label: string;
  value: string;
}

export interface AgentModuleChange {
  module: AssociationModule;
  previousState: boolean;
  nextState: boolean;
}

interface AgentConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  items: AgentConfirmationItem[];
  moduleChanges?: AgentModuleChange[];
  confirmLabel: string;
  confirmVariant?: 'primary' | 'danger';
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export default function AgentConfirmationModal({
  isOpen,
  title,
  description,
  items,
  moduleChanges = [],
  confirmLabel,
  confirmVariant = 'primary',
  isLoading = false,
  onConfirm,
  onClose,
}: AgentConfirmationModalProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen && !isLoading) onClose();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const actionClass = confirmVariant === 'danger'
    ? 'bg-[var(--Flush-Mahogany)] hover:bg-[#a81c20]'
    : 'bg-[var(--Mosaic-Tile)] hover:bg-[#0f5953]';

  return (
    <div
      role="presentation"
      onClick={() => { if (!isLoading) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--ink)]/50 p-4 backdrop-blur-[0.13rem]"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="agent-confirmation-title"
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-[34rem] rounded-[1.25rem] border border-[var(--line)] bg-[var(--White)] p-6 shadow-2xl sm:p-8"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] pb-4">
          <h2 id="agent-confirmation-title" className="text-xl font-black uppercase tracking-tight text-[var(--ink)] sm:text-2xl">
            {title}
          </h2>
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            aria-label="Fermer la boîte de dialogue"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--paper)] hover:text-[var(--ink)] disabled:opacity-50"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <div className="mt-5 space-y-4 text-sm text-[var(--ink)]">
          <p className="text-xs leading-relaxed text-[var(--muted)]">{description}</p>
          <dl className="space-y-2">
            {items.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3 rounded-[0.75rem] border border-[var(--line)] bg-[var(--paper)] p-3">
                <dt className="text-xs font-bold text-[var(--muted)]">{item.label}</dt>
                <dd className="text-right text-xs font-bold text-[var(--ink)]">{item.value}</dd>
              </div>
            ))}
          </dl>
          {moduleChanges.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Modules</p>
              {moduleChanges.map((change) => (
                <div key={change.module} className="flex items-center justify-between gap-3 rounded-[0.75rem] border border-[var(--line)] bg-[var(--paper)] p-3">
                  <StatusTag status={change.module} />
                  <span className="text-xs font-bold">
                    {change.previousState ? 'Actif' : 'Inactif'} → {change.nextState ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" disabled={isLoading} onClick={onClose} className="inline-flex h-11 items-center justify-center rounded-[0.75rem] border border-[var(--line)] px-5 text-xs font-bold uppercase tracking-wider text-[var(--ink)] hover:bg-[var(--paper)] disabled:opacity-50">
            Annuler
          </button>
          <button type="button" disabled={isLoading} onClick={onConfirm} className={`inline-flex h-11 items-center justify-center gap-2 rounded-[0.75rem] px-5 text-xs font-bold uppercase tracking-wider text-[var(--White)] shadow-sm disabled:opacity-50 ${actionClass}`}>
            {isLoading && <span className="animate-spin" aria-hidden="true">⟳</span>}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
