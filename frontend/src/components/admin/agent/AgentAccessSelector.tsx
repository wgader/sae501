'use client';

import { cva } from 'class-variance-authority';
import type { AssociationModule } from '@/components/admin/StatusTag';
import Switch from '@/components/ui/Switch';
import { AGENT_MODULES, type AgentAccess } from '@/lib/agentAccess';

interface AgentAccessSelectorProps {
  access: AgentAccess;
  /** Un administrateur ne peut pas retirer ses propres droits. */
  isAdminLocked: boolean;
  onToggleAdmin: (isAdmin: boolean) => void;
  onToggleModule: (module: AssociationModule) => void;
}

const optionVariants = cva('flex items-center gap-3 rounded-card border px-4 py-3 transition-colors', {
  variants: {
    selected: {
      true: 'border-primary bg-primary-soft',
      false: 'border-line bg-white',
    },
  },
});

/** Droits d'un agent : accès administrateur complet, ou modules choisis un par un. */
export default function AgentAccessSelector({ access, isAdminLocked, onToggleAdmin, onToggleModule }: AgentAccessSelectorProps) {
  const adminHint = isAdminLocked
    ? 'Vous ne pouvez pas retirer vos propres droits d’administrateur.'
    : 'Accès complet à tous les modules et à la gestion des agents.';

  return (
    <fieldset className="space-y-4">
      <legend className="text-base font-bold tracking-section text-ink">Droits d’accès</legend>

      <div className={optionVariants({ selected: access.isAdmin })}>
        <Switch
          checked={access.isAdmin}
          disabled={isAdminLocked}
          onCheckedChange={onToggleAdmin}
          ariaLabel="Accès administrateur"
        />
        <span className="min-w-0">
          <span className="block text-body-sm font-bold text-ink">Administrateur</span>
          <span className="mt-0.5 block text-meta text-muted">{adminHint}</span>
        </span>
      </div>

      <div>
        <p className="text-meta text-muted">
          {access.isAdmin ? 'Tous les modules sont inclus avec l’accès administrateur.' : 'Sélectionnez au moins un module.'}
        </p>
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
