'use client';

import { useState, type HTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { Association, AssociationStatus } from '@/lib/api';
import StatusTag, { type AssociationModule } from './StatusTag';
import Button from '@/components/ui/Button';
import type { ModuleChangeItem } from '@/components/ui/ConfirmationModal';

export const itemCardVariants = cva(
  'group flex flex-col rounded-[1.13rem] border border-[var(--line)] bg-[var(--White)] shadow-xs transition-all duration-200 hover:border-[var(--Mosaic-Tile)]/40 hover:shadow-md w-full overflow-hidden',
);

export interface ItemCardDataProps {
  name: string;
  association?: Association;
  status?: AssociationStatus;
  moduleSubventionActif?: boolean;
  moduleSalleActif?: boolean;
  moduleMaterielActif?: boolean;
  permissions?: AssociationModule[];
  isExpanded?: boolean;
  enableModuleEditor?: boolean;
}

export interface ItemCardProps
  extends Omit<HTMLAttributes<HTMLLIElement>, 'name'>,
    VariantProps<typeof itemCardVariants> {
  onToggleExpand?: () => void;
  onSaveModules?: (
    newPermissions: AssociationModule[],
    changes: ModuleChangeItem[],
  ) => void;
  onRequestModuleChange?: (moduleId: AssociationModule, nextState: boolean) => void;
  onClick?: () => void;
  isUpdating?: boolean;
  children?: ReactNode;
}

const MODULES_CONFIG: Array<{
  id: AssociationModule;
  label: string;
  icon: string;
}> = [
  {
    id: 'subventions',
    label: 'Subventions financières',
    icon: '💶',
  },
  {
    id: 'salles',
    label: 'Réservation de salles',
    icon: '🏛️',
  },
  {
    id: 'materiel',
    label: 'Prêt de matériel',
    icon: '📦',
  },
];

export default function ItemCard({
  name,
  association,
  status,
  moduleSubventionActif,
  moduleSalleActif,
  moduleMaterielActif,
  permissions,
  isExpanded: isExpandedProp,
  enableModuleEditor,
  onToggleExpand,
  onSaveModules,
  onRequestModuleChange,
  onClick,
  isUpdating = false,
  className,
  children,
  ...props
}: ItemCardDataProps & ItemCardProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = isExpandedProp !== undefined ? isExpandedProp : internalExpanded;

  // L'éditeur est actif si expressément demandé ou si onSaveModules est fourni
  const isEditorEnabled = enableModuleEditor ?? Boolean(onSaveModules || onRequestModuleChange);

  // État actuel actif (sauvegardé côté serveur / props)
  const isSubventionActive = Boolean(
    moduleSubventionActif ??
      association?.moduleSubventionActif ??
      (permissions || association?.permissions)?.includes('subventions'),
  );
  const isSalleActive = Boolean(
    moduleSalleActif ??
      association?.moduleSalleActif ??
      (permissions || association?.permissions)?.includes('salles'),
  );
  const isMaterielActive = Boolean(
    moduleMaterielActif ??
      association?.moduleMaterielActif ??
      (permissions || association?.permissions)?.includes('materiel'),
  );

  const hasAnyModule = isSubventionActive || isSalleActive || isMaterielActive;

  // Brouillon local pour permettre de cocher/décocher plusieurs modules avant validation
  const [draft, setDraft] = useState<{
    subventions: boolean;
    salles: boolean;
    materiel: boolean;
  } | null>(null);

  const currentSelection = draft ?? {
    subventions: isSubventionActive,
    salles: isSalleActive,
    materiel: isMaterielActive,
  };

  // Liste des modifications en cours par rapport à l'état actif actuel
  const pendingChanges: ModuleChangeItem[] = [];
  if (currentSelection.subventions !== isSubventionActive) {
    pendingChanges.push({
      id: 'subventions',
      label: 'Subventions financières',
      previousState: isSubventionActive,
      nextState: currentSelection.subventions,
    });
  }
  if (currentSelection.salles !== isSalleActive) {
    pendingChanges.push({
      id: 'salles',
      label: 'Réservation de salles',
      previousState: isSalleActive,
      nextState: currentSelection.salles,
    });
  }
  if (currentSelection.materiel !== isMaterielActive) {
    pendingChanges.push({
      id: 'materiel',
      label: 'Prêt de matériel',
      previousState: isMaterielActive,
      nextState: currentSelection.materiel,
    });
  }

  const hasChanges = pendingChanges.length > 0;

  const handleHeaderClick = () => {
    if (isEditorEnabled) {
      if (onToggleExpand) {
        onToggleExpand();
      } else {
        setInternalExpanded((prev) => !prev);
      }
    } else if (onClick) {
      onClick();
    }
  };

  const handleCheckboxToggle = (modId: AssociationModule) => {
    setDraft({
      ...currentSelection,
      [modId]: !currentSelection[modId],
    });
  };

  const handleValidateClick = () => {
    if (!hasChanges || isUpdating) return;

    const newPermissions: AssociationModule[] = [];
    if (currentSelection.subventions) newPermissions.push('subventions');
    if (currentSelection.salles) newPermissions.push('salles');
    if (currentSelection.materiel) newPermissions.push('materiel');

    if (onSaveModules) {
      onSaveModules(newPermissions, pendingChanges);
    } else if (onRequestModuleChange && pendingChanges.length > 0) {
      // Fallback si seul onRequestModuleChange unitaire est présent
      onRequestModuleChange(pendingChanges[0].id, pendingChanges[0].nextState);
    }
  };

  const handleResetDraft = () => {
    setDraft(null);
  };

  return (
    <li className={cn(itemCardVariants(), className)} {...props}>
      {/* ── En-tête cliquable de la card ──────────────────────── */}
      <button
        type="button"
        onClick={handleHeaderClick}
        aria-expanded={isEditorEnabled ? isExpanded : undefined}
        aria-label={
          isEditorEnabled
            ? `${isExpanded ? 'Réduire' : 'Développer'} les modules de ${name}`
            : `Consulter le dossier de ${name}`
        }
        className="flex w-full cursor-pointer items-center justify-between gap-4 p-5 sm:p-6 text-left transition-colors hover:bg-[var(--paper)]/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--Mosaic-Tile)]"
      >
        <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
          <h2 className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-[0.94rem] sm:text-[1rem] font-bold uppercase tracking-tight text-[var(--ink)] group-hover:text-[var(--Mosaic-Tile)] transition-colors">
            {name}
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            {status && <StatusTag status={status} />}
            {isSubventionActive && <StatusTag status="subventions" />}
            {isSalleActive && <StatusTag status="salles" />}
            {isMaterielActive && <StatusTag status="materiel" />}
            {!hasAnyModule && !status && (
              <span className="text-xs text-[var(--muted)]">Aucun module actif</span>
            )}
          </div>
        </div>

        {children}

        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--ink)] transition-transform duration-200 group-hover:text-[var(--Mosaic-Tile)]',
            isEditorEnabled && isExpanded ? 'rotate-90' : 'rotate-0',
          )}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </span>
      </button>

      {/* ── Section dépliable : Éditeur de modules compact sans descriptions ──────────── */}
      {isEditorEnabled && isExpanded && (
        <div className="border-t border-[var(--line)] bg-[var(--paper)]/70 p-5 sm:p-6 transition-all">
          <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
            {/* <div>
              <p className="text-[0.69rem] font-bold uppercase tracking-[0.16em] text-[var(--Mosaic-Tile)]">
                Habilitations aux modules municipaux
              </p>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                Cochez ou décochez les modules pour cette association, puis validez pour confirmer.
              </p>
            </div> */}
            {isUpdating && (
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--Mosaic-Tile)]">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Mise à jour en cours...</span>
              </span>
            )}
          </div>

          {/* Grille compacte des modules à cocher (SANS descriptions encombrantes) */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {MODULES_CONFIG.map((mod) => {
              const isChecked = currentSelection[mod.id];

              return (
                <label
                  key={mod.id}
                  className={cn(
                    'relative flex cursor-pointer items-center justify-between gap-3 rounded-[0.88rem] border p-3.5 sm:p-4 transition-all select-none',
                    isChecked
                      ? 'border-[var(--Mosaic-Tile)] bg-[var(--White)] shadow-xs ring-1 ring-[var(--Mosaic-Tile)]/20'
                      : 'border-[var(--line)] bg-[var(--White)]/70 hover:bg-[var(--White)] hover:border-[var(--line)]',
                    isUpdating && 'pointer-events-none opacity-60',
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isUpdating}
                      onChange={() => handleCheckboxToggle(mod.id)}
                      className="h-4 w-4 rounded-[0.25rem] border-[var(--line)] text-[var(--Mosaic-Tile)] accent-[var(--Mosaic-Tile)] focus:ring-[var(--Mosaic-Tile)] cursor-pointer"
                    />
                    <div className="flex items-center gap-2 truncate">
                      {/* <span className="text-base" aria-hidden="true">
                        {mod.icon}
                      </span> */}
                      <span className="text-xs font-bold text-[var(--ink)] truncate">
                        {mod.label}
                      </span>
                    </div>
                  </div>

                  {/* <span
                    className={cn(
                      'shrink-0 rounded-full px-2.5 py-0.5 text-[0.63rem] font-bold uppercase tracking-wider transition-colors',
                      isChecked
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200',
                    )}
                  >
                    {isChecked ? '✓ Actif' : '✕ Inactif'}
                  </span> */}
                </label>
              );
            })}
          </div>

          {/* Barre d'action avec déclencheur de confirmation */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-3.5">
            {/* <div className="flex items-center gap-3">
              {hasChanges ? (
                <>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--Lime-Cream)]/70 px-3 py-1 text-[0.69rem] font-bold text-[var(--ink)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--Mosaic-Tile)] animate-pulse" />
                    {pendingChanges.length} modification{pendingChanges.length > 1 ? 's' : ''} en attente
                  </span>
                  <button
                    type="button"
                    onClick={handleResetDraft}
                    disabled={isUpdating}
                    className="text-[0.69rem] font-bold uppercase tracking-wider text-[var(--muted)] hover:text-[var(--ink)] transition-colors cursor-pointer underline underline-offset-2 disabled:opacity-50"
                  >
                    Réinitialiser
                  </button>
                </>
              ) : (
                <span className="text-[0.69rem] text-[var(--muted)]">
                  Aucune modification en attente. Cochez ou décochez les modules ci-dessus.
                </span>
              )}
            </div> */}

            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={!hasChanges || isUpdating}
              isLoading={isUpdating}
              onClick={handleValidateClick}
              leftIcon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              }
            >
              Valider les modifications
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}

