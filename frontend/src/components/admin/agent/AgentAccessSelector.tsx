'use client';

import { cva } from 'class-variance-authority';
import type { AssociationModule } from '@/components/admin/StatusTag';
import Button from '@/components/ui/Button';
import Switch from '@/components/ui/Switch';
import { AGENT_MODULES, type AgentAccess } from '@/lib/agentAccess';

/** `locked` : le compte administrateur connecté ; `removable` : un administrateur en trop à rétrograder. */
export type AdminOption = 'hidden' | 'locked' | 'removable';

interface AgentAccessSelectorProps {
  access: AgentAccess;
  adminOption: AdminOption;
  onToggleAdmin: (isAdmin: boolean) => void;
  onToggleModule: (module: AssociationModule) => void;
  onToggleAllModules: (selectAll: boolean) => void;
}

const optionVariants = cva('flex items-center gap-3 rounded-card border px-4 py-3 transition-colors', {
  variants: {
    selected: {
      true: 'border-primary bg-primary-soft',
      false: 'border-line bg-white',
    },
  },
});

const ADMIN_HINTS: Record<Exclude<AdminOption, 'hidden'>, string> = {
  locked: 'Ce compte est l’administrateur de l’application : ses droits ne peuvent pas être modifiés.',
  removable: 'L’application ne garde qu’un administrateur : retirez ce droit puis choisissez ses modules.',
};

/** Droits d'un agent : modules choisis un par un, l'accès administrateur restant unique. */
export default function AgentAccessSelector({ access, adminOption, onToggleAdmin, onToggleModule, onToggleAllModules }: AgentAccessSelectorProps) {
  const hasEveryModule = AGENT_MODULES.every((module) => access.modules.includes(module.id));

  return (
    <fieldset className="space-y-4">
      <legend className="text-base font-bold tracking-section text-ink">Droits d’accès</legend>

      {adminOption !== 'hidden' && (
        <div className={optionVariants({ selected: access.isAdmin })}>
          <Switch
            checked={access.isAdmin}
            disabled={adminOption === 'locked'}
            onCheckedChange={onToggleAdmin}
            ariaLabel="Accès administrateur"
          />
          <span className="min-w-0">
            <span className="block text-body-sm font-bold text-ink">Administrateur</span>
            <span className="mt-0.5 block text-meta text-muted">{ADMIN_HINTS[adminOption]}</span>
          </span>
        </div>
      )}

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-meta text-muted">
            {access.isAdmin ? 'Tous les modules sont inclus avec l’accès administrateur.' : 'Sélectionnez au moins un module.'}
          </p>
          {!access.isAdmin && (
            <Button type="button" variant="secondary" size="sm" onClick={() => onToggleAllModules(!hasEveryModule)}>
              {hasEveryModule ? 'Tout retirer' : 'Tous les modules'}
            </Button>
          )}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {AGENT_MODULES.map((module) => {
            const selected = access.isAdmin || access.modules.includes(module.id);
            return (
              <div key={module.id} className={optionVariants({ selected })}>
                <Switch
                  checked={selected}
                  disabled={access.isAdmin}
                  onCheckedChange={() => onToggleModule(module.id)}
                  ariaLabel={`Module ${module.title}`}
                />
                <span className="min-w-0">
                  <span className="block text-body-sm font-bold text-ink">{module.title}</span>
                  <span className="mt-0.5 block text-meta text-muted">{module.description}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </fieldset>
  );
}
