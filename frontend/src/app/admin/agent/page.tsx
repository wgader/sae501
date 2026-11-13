'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import FilterTag from '@/components/admin/FilterTag';
import StatusTag, { type AssociationModule } from '@/components/admin/StatusTag';
import Button from '@/components/ui/Button';
import FormField from '@/components/ui/FormField';
import AgentConfirmationModal, {
  type AgentConfirmationItem,
  type AgentModuleChange,
} from '@/components/ui/AgentConfirmationModal';
import {
  createAdminAgent,
  deleteAdminAgent,
  getAdminAgents,
  updateAdminAgent,
  type AdminAgent,
} from '@/lib/api';

import AdminLayout from '@/components/admin/AdminLayout';

type View = 'list' | 'create' | 'edit';

interface Agent {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  modules: AssociationModule[];
  roles: string[];
}

interface AgentFormState {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  modules: AssociationModule[];
}

const MODULES: Array<{
  id: AssociationModule;
  title: string;
  description: string;
}> = [
  { id: 'evenements', title: 'Événement', description: 'Gestion des événements externes' },
  { id: 'subventions', title: 'Subvention', description: 'Gestion des demandes de subvention' },
  { id: 'materiel', title: 'Matériel', description: 'Gestion des réservations de matériel' },
  { id: 'salles', title: 'Salle', description: 'Gestion des réservations de salles' },
];

const MODULE_ROLES: Record<AssociationModule, string> = {
  evenements: 'ROLE_GESTION_EVENT',
  subventions: 'ROLE_GESTION_SUBVENTION',
  materiel: 'ROLE_GESTION_MATERIEL',
  salles: 'ROLE_GESTION_SALLE',
};

const emptyForm: AgentFormState = {
  nom: '',
  prenom: '',
  email: '',
  telephone: '',
  modules: [],
};

function rolesFromModules(modules: AssociationModule[]): string[] {
  return modules.map((module) => MODULE_ROLES[module]);
}

function modulesFromRoles(roles: string[]): AssociationModule[] {
  return MODULES
    .filter((module) => roles.includes(MODULE_ROLES[module.id]))
    .map((module) => module.id);
}

function mapApiAgent(agent: AdminAgent): Agent {
  return {
    id: agent.id,
    nom: agent.nom,
    prenom: agent.prenom,
    email: agent.email,
    telephone: agent.telephone ?? '',
    modules: modulesFromRoles(agent.roles),
    roles: agent.roles,
  };
}

function ArrowRight() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M5 12h13M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowLeft() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AgentCard({ agent, onSelect }: { agent: Agent; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center justify-between gap-4 rounded-[0.9rem] border border-[#dce3e4] bg-white px-4 py-4 text-left transition hover:border-[var(--Mosaic-Tile)] hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--Mosaic-Tile)]"
    >
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold uppercase tracking-[0.02em] text-[var(--ink)]">
          {agent.prenom} {agent.nom}
        </span>
        <span className="mt-2 flex flex-wrap gap-2">
          {agent.modules.map((module) => (
            <StatusTag key={module} status={module} />
          ))}
        </span>
      </span>
      <span className="shrink-0 text-[var(--ink)]">
        <ArrowRight />
      </span>
    </button>
  );
}

function ModuleSelector({
  selectedModules,
  onToggle,
}: {
  selectedModules: AssociationModule[];
  onToggle: (module: AssociationModule) => void;
}) {
  return (
    <fieldset>
      <legend className="text-base font-bold tracking-[0.16em] text-[var(--ink)]">Accès aux modules</legend>
      <p className="mt-2 text-xs text-[var(--muted)]">
        Sélectionnez un ou plusieurs modules pour définir les droits de l&apos;agent.
      </p>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {MODULES.map((module) => {
          const selected = selectedModules.includes(module.id);
          return (
            <label
              key={module.id}
              className={`flex min-h-[4.25rem] cursor-pointer items-center gap-3 rounded-[0.9rem] border px-3.5 py-3 transition ${
                selected
                  ? 'border-[var(--Mosaic-Tile)] bg-[var(--Mosaic-Tile)]/[0.03]'
                  : 'border-[var(--line)] bg-white hover:border-[var(--Mosaic-Tile)]'
              }`}
            >
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onToggle(module.id)}
                className="h-5 w-5 accent-[var(--Mosaic-Tile)]"
              />
              <span>
                <span className="block text-sm font-bold text-[var(--ink)]">{module.title}</span>
                <span className="mt-1 block text-[0.68rem] text-[var(--muted)]">{module.description}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function AgentForm({
  mode,
  form,
  onChange,
  onToggleModule,
  onSubmit,
  onCancel,
  onDelete,
  isSubmitting,
}: {
  mode: 'create' | 'edit';
  form: AgentFormState;
  onChange: (field: keyof Omit<AgentFormState, 'modules'>, value: string) => void;
  onToggleModule: (module: AssociationModule) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onDelete?: () => void;
  isSubmitting: boolean;
}) {
  const isEdit = mode === 'edit';

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="space-y-8"
    >
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--line)] pb-5">
        <div>
          <button
            type="button"
            onClick={onCancel}
            className="mb-4 inline-flex items-center gap-1 text-[0.68rem] font-bold text-[var(--Mosaic-Tile)] hover:underline"
          >
            <ArrowLeft />
            <span>Retour à la liste des agents</span>
          </button>
          <h1 className="text-2xl font-black uppercase tracking-[0.12em] text-[var(--ink)]">
            {isEdit ? 'Modifier un agent' : 'Ajouter un agent'}
          </h1>
        </div>
        {isEdit && (
          <div className="flex flex-wrap gap-2">
            {form.modules.map((module) => (
              <StatusTag key={module} status={module} />
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-8 xl:grid-cols-[1fr_1.15fr]">
        <section aria-labelledby="agent-information-heading">
          <h2 id="agent-information-heading" className="text-base font-bold tracking-[0.16em] text-[var(--ink)]">
            {isEdit ? 'Informations de l’agent' : 'Identité et contact'}
          </h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <FormField label="Prénom" value={form.prenom} onChange={(event) => onChange('prenom', event.target.value)} placeholder="exemple : Camille" />
            <FormField label="Nom de famille" value={form.nom} onChange={(event) => onChange('nom', event.target.value)} placeholder="exemple : Dupont" />
            <FormField label="Adresse e-mail" type="email" value={form.email} onChange={(event) => onChange('email', event.target.value)} placeholder="exemple : monadresse@domaine.fr" />
            <FormField label="Téléphone" required={false} value={form.telephone} onChange={(event) => onChange('telephone', event.target.value)} placeholder="exemple : 05 XX XX XX XX" />
          </div>
          {isEdit && (
            <p className="mt-6 text-xs text-[var(--muted)]">
              Les coordonnées non renseignées peuvent être complétées ultérieurement.
            </p>
          )}
        </section>

        <section className="border-t border-[var(--line)] pt-8 xl:border-l xl:border-t-0 xl:pl-8 xl:pt-0">
          <ModuleSelector selectedModules={form.modules} onToggle={onToggleModule} />
        </section>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-6">
        <div className="flex flex-wrap gap-3">
          <Button type="submit" size="sm" isLoading={isSubmitting}>
            {isEdit ? 'Enregistrer les modifications' : 'Enregistrer'}
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
            Annuler
          </Button>
        </div>
        {onDelete && (
          <Button type="button" variant="danger" size="sm" onClick={onDelete} disabled={isSubmitting}>
            Supprimer le compte
          </Button>
        )}
      </footer>
    </form>
  );
}

export default function AdminAgentsPage() {
  const [view, setView] = useState<View>('list');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [form, setForm] = useState<AgentFormState>(emptyForm);
  const [moduleFilter, setModuleFilter] = useState<AssociationModule | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    | { type: 'create' | 'update'; form: AgentFormState; agentId: number | null; roles: string[] }
    | { type: 'delete'; agent: Agent }
    | null
  >(null);

  const loadAgents = useCallback(async () => {
    try {
      const response = await getAdminAgents();
      setAgents(response.items.map(mapApiAgent));
      setLoadError(null);
    } catch (error: unknown) {
      setLoadError(error instanceof Error ? error.message : 'Impossible de charger les agents.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAgents();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadAgents]);

  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId);
  const filteredAgents = useMemo(
    () => moduleFilter === 'all' ? agents : agents.filter((agent) => agent.modules.includes(moduleFilter)),
    [agents, moduleFilter],
  );

  const openCreate = () => {
    setForm(emptyForm);
    setView('create');
  };

  const openEdit = (agent: Agent) => {
    setSelectedAgentId(agent.id);
    setForm({
      nom: agent.nom,
      prenom: agent.prenom,
      email: agent.email,
      telephone: agent.telephone,
      modules: agent.modules,
    });
    setView('edit');
  };

  const updateForm = (field: keyof Omit<AgentFormState, 'modules'>, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const toggleModule = (module: AssociationModule) => {
    setForm((current) => ({
      ...current,
      modules: current.modules.includes(module)
        ? current.modules.filter((item) => item !== module)
        : [...current.modules, module],
    }));
  };

  const saveAgent = () => {
    if (form.modules.length === 0) {
      setMutationError('Sélectionnez au moins un module pour cet agent.');
      return;
    }

    setMutationError(null);
    const existingAgent = selectedAgentId === null
      ? undefined
      : agents.find((agent) => agent.id === selectedAgentId);
    const roles = [
      ...(existingAgent?.roles.includes('ROLE_ADMIN') ? ['ROLE_ADMIN'] : []),
      ...rolesFromModules(form.modules),
    ];
    setPendingAction({
      type: view === 'create' ? 'create' : 'update',
      form: { ...form, modules: [...form.modules] },
      agentId: selectedAgentId,
      roles: [...new Set(roles)],
    });
  };

  const confirmAction = async () => {
    if (!pendingAction) return;
    setIsSubmitting(true);
    setIsLoading(true);
    setMutationError(null);
    try {
      if (pendingAction.type === 'delete') {
        await deleteAdminAgent(pendingAction.agent.id);
      } else {
        const payload = {
          nom: pendingAction.form.nom,
          prenom: pendingAction.form.prenom,
          email: pendingAction.form.email,
          telephone: pendingAction.form.telephone || null,
          roles: pendingAction.roles,
        };
        if (pendingAction.type === 'create') {
          await createAdminAgent(payload);
        } else if (pendingAction.agentId !== null) {
          await updateAdminAgent(pendingAction.agentId, payload);
        }
      }
      await loadAgents();
      setSelectedAgentId(null);
      setView('list');
      setPendingAction(null);
    } catch (error: unknown) {
      setMutationError(error instanceof Error ? error.message : 'Impossible de traiter cette action.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteAgent = () => {
    if (selectedAgent) setPendingAction({ type: 'delete', agent: selectedAgent });
  };

  const pendingForm = pendingAction && pendingAction.type !== 'delete' ? pendingAction.form : null;
  const pendingAgent = pendingAction?.type === 'delete' ? pendingAction.agent : null;
  const moduleChanges: AgentModuleChange[] = pendingForm && selectedAgent
    ? MODULES.map((module) => ({
      module: module.id,
      previousState: selectedAgent.modules.includes(module.id),
      nextState: pendingForm.modules.includes(module.id),
    })).filter((change) => change.previousState !== change.nextState)
    : [];
  const confirmationItems: AgentConfirmationItem[] = pendingForm
    ? [
      { label: 'Nom', value: `${pendingForm.prenom} ${pendingForm.nom}` },
      { label: 'E-mail', value: pendingForm.email },
      { label: 'Téléphone', value: pendingForm.telephone || 'Non renseigné' },
    ]
    : pendingAgent
    ? [
      { label: 'Nom', value: `${pendingAgent.prenom} ${pendingAgent.nom}` },
      { label: 'E-mail', value: pendingAgent.email },
    ]
    : [];

  if (view !== 'list') {
    return (
      <section className="mx-auto max-w-5xl">
        <AgentForm
          mode={view}
          form={form}
          onChange={updateForm}
          onToggleModule={toggleModule}
          onSubmit={saveAgent}
          onCancel={() => setView('list')}
          onDelete={selectedAgent ? deleteAgent : undefined}
          isSubmitting={isSubmitting}
        />
        {mutationError && (
          <p role="alert" className="mt-4 rounded-[0.9rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {mutationError}
          </p>
        )}
        <AgentConfirmationModal
          isOpen={Boolean(pendingAction)}
          title={pendingAgent ? 'Supprimer cet agent' : view === 'create' ? 'Confirmer la création' : 'Confirmer les modifications'}
          description={pendingAgent
            ? 'Cette action supprimera le compte de cet agent. Voulez-vous continuer ?'
            : 'Vérifiez les informations avant de confirmer cette opération.'}
          items={confirmationItems}
          moduleChanges={moduleChanges}
          confirmLabel={pendingAgent ? 'Confirmer la suppression' : view === 'create' ? 'Confirmer la création' : 'Confirmer les modifications'}
          confirmVariant={pendingAgent ? 'danger' : 'primary'}
          isLoading={isSubmitting}
          onConfirm={confirmAction}
          onClose={() => { if (!isSubmitting) setPendingAction(null); }}
        />
      </section>
    );
  }

  return (
    <AdminLayout>
    <section className="mx-auto max-w-5xl space-y-7">
      <AdminPageHeader
        eyebrow=""
        title="Gestion des agents"
        description="Gérez les accès des agents municipaux aux différents services de la ville."
        className="relative"
      >
        <Button type="button" size="sm" onClick={openCreate} className="mt-5 sm:absolute sm:right-0 sm:top-0 sm:mt-0">
          Ajouter un agent
        </Button>
      </AdminPageHeader>

      <section aria-labelledby="agents-filter-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="agents-filter-heading" className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--muted)]">
            <span aria-hidden="true" className="mr-2">▽</span>
            Filtrer les agents
          </h2>
          <div className="flex flex-wrap gap-2">
            <FilterTag
              label="Tous"
              isSelected={moduleFilter === 'all'}
              onClick={() => setModuleFilter('all')}
              className="min-h-0 min-w-0 px-3 py-2 text-[0.68rem] tracking-[0.06rem]"
            />
            {MODULES.map((module) => (
              <FilterTag
                key={module.id}
                label={module.title}
                isSelected={moduleFilter === module.id}
                onClick={() => setModuleFilter(module.id)}
                className="min-h-0 min-w-0 px-3 py-2 text-[0.68rem] tracking-[0.06rem]"
              />
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="agents-list-heading">
        <h2 id="agents-list-heading" className="sr-only">Liste des agents</h2>
        {isLoading && (
          <p className="rounded-[0.9rem] border border-[var(--line)] px-5 py-8 text-center text-sm text-[var(--muted)]">
            Chargement des agents...
          </p>
        )}
        {loadError && (
          <p role="alert" className="rounded-[0.9rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {loadError}
          </p>
        )}
        {!isLoading && !loadError && filteredAgents.length > 0 && (
          <ul className="space-y-4 p-0 list-none">
            {filteredAgents.map((agent) => (
              <li key={agent.id}>
                <AgentCard agent={agent} onSelect={() => openEdit(agent)} />
              </li>
            ))}
          </ul>
        )}
        {!isLoading && !loadError && filteredAgents.length === 0 && (
          <p className="rounded-[0.9rem] border border-dashed border-[var(--line)] px-5 py-8 text-center text-sm text-[var(--muted)]">
            Aucun agent ne correspond à ce filtre.
          </p>
        )}
      </section>
    </section>
    </AdminLayout>
  );
}
