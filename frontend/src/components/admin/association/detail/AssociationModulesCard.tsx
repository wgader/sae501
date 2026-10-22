'use client';

import { type AssociationModule } from '@/lib/api';
import Switch from '@/components/ui/Switch';
import {
  IconSubvention,
  IconSalle,
  IconMateriel,
} from '@/components/ui/icons';

interface AssociationModulesCardProps {
  permissions: AssociationModule[];
  onToggleModule: (module: AssociationModule, enabled: boolean) => void;
  disabled?: boolean;
}

interface ModuleItem {
  id: AssociationModule;
  label: string;
  description: string;
  icon: typeof IconSubvention;
}

const MODULE_DEFINITIONS: ModuleItem[] = [
  {
    id: 'subventions',
    label: 'Subventions',
    description: 'Dépôt et instruction des demandes d’aides financières annuelles.',
    icon: IconSubvention,
  },
  {
    id: 'salles',
    label: 'Réservation de salles',
    description: 'Accès au planning et aux demandes d’espaces municipaux.',
    icon: IconSalle,
  },
  {
    id: 'materiel',
    label: 'Prêt de matériel',
    description: 'Réservation d’équipements et logistique communale.',
    icon: IconMateriel,
  },
];

export default function AssociationModulesCard({
  permissions,
  onToggleModule,
  disabled = false,
}: AssociationModulesCardProps) {
  return (
    <article className="rounded-[14px] border border-[var(--line)] bg-[var(--White)] p-6 sm:p-7 shadow-xs">
      <header className="border-b border-[var(--line)] pb-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
          Modules
        </h2>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Droits par module
        </p>
      </header>

      <ul className="mt-5 space-y-3.5 p-0 list-none">
        {MODULE_DEFINITIONS.map((mod) => {
          const Icon = mod.icon;
          const isChecked = permissions.includes(mod.id);

          return (
            <li
              key={mod.id}
              className="flex items-center justify-between gap-4 rounded-[12px] border border-[var(--line)] bg-[var(--paper)] p-4 transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--White)] text-[var(--Mosaic-Tile)] shadow-2xs">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="truncate text-xs font-bold text-[var(--ink)]">
                    {mod.label}
                  </h3>
                  <p
                    className={`mt-0.5 text-[0.6875rem] font-semibold ${
                      isChecked ? 'text-[var(--Mosaic-Tile)]' : 'text-[var(--muted)]'
                    }`}
                  >
                    {isChecked ? 'Accès attribué' : 'Accès désactivé'}
                  </p>
                </div>
              </div>

              <Switch
                checked={isChecked}
                onCheckedChange={(checked) => onToggleModule(mod.id, checked)}
                disabled={disabled}
                ariaLabel={`Activer ou désactiver le module ${mod.label}`}
              />
            </li>
          );
        })}
      </ul>
    </article>
  );
}
