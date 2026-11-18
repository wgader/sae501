'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AgentForm, { type AgentFormState, type AgentTextField } from '@/components/admin/agent/AgentForm';
import AgentListCard, { type AgentSummary } from '@/components/admin/agent/AgentListCard';
import FilterTag from '@/components/admin/FilterTag';
import type { AssociationModule } from '@/components/admin/StatusTag';
import AgentConfirmationModal, {
  type AgentConfirmationItem,
  type AgentModuleChange,
} from '@/components/ui/AgentConfirmationModal';
import Button from '@/components/ui/Button';
import Notice from '@/components/ui/Notice';
import { AGENT_MODULES, accessFromRoles, describeAccess, rolesFromAccess } from '@/lib/agentAccess';
import {
  createAdminAgent,
  deleteAdminAgent,
  getAdminAgents,
  resendAdminAgentInvitation,
  updateAdminAgent,
  type AdminAgent,
} from '@/lib/api';
import { readSession } from '@/lib/session';

type View = 'list' | 'create' | 'edit';
type AgentFilter = AssociationModule | 'all' | 'admin';
type Feedback = { tone: 'success' | 'warning'; message: string };
type PendingAction =
  | { type: 'create' | 'update'; form: AgentFormState; agentId: number | null }
  | { type: 'delete'; agent: AgentSummary };

const EMPTY_FORM: AgentFormState = { nom: '', prenom: '', email: '', telephone: '', isAdmin: false, modules: [] };
const FILTER_TAG_CLASS = 'min-h-0 min-w-0 px-3 py-2 text-label tracking-wider';

function toSummary(agent: AdminAgent): AgentSummary {
  return {
    id: agent.id,
    nom: agent.nom,
    prenom: agent.prenom,
    email: agent.email,
    telephone: agent.telephone ?? '',
    isVerified: agent.isVerified,
    ...accessFromRoles(agent.roles),
  };
}

export default function AdminAgentsPage() {
  const [view, setView] = useState<View>('list');
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [form, setForm] = useState<AgentFormState>(EMPTY_FORM);
  const [filter, setFilter] = useState<AgentFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [currentUserId] = useState(() => readSession()?.user.id ?? null);

  const loadAgents = useCallback(async () => {
    try {
      const response = await getAdminAgents();
      setAgents(response.items.map(toSummary));
      setLoadError(null);
    } catch (error: unknown) {
      setLoadError(error instanceof Error ? error.message : 'Impossible de charger les agents.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAgents(), 0);
    return () => window.clearTimeout(timer);
  }, [loadAgents]);

  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId);
  const isOwnAccount = selectedAgent !== undefined && selectedAgent.id === currentUserId;

  const filteredAgents = useMemo(() => {
    if (filter === 'all') return agents;
    if (filter === 'admin') return agents.filter((agent) => agent.isAdmin);
    return agents.filter((agent) => agent.modules.includes(filter));
  }, [agents, filter]);

  const backToList = () => {
    setSelectedAgentId(null);
    setMutationError(null);
    setView('list');
  };

  const openCreate = () => {
    setSelectedAgentId(null);
    setForm(EMPTY_FORM);
    setMutationError(null);
    setFeedback(null);
    setView('create');
  };

  const openEdit = (agent: AgentSummary) => {
    setSelectedAgentId(agent.id);
    setForm({
      nom: agent.nom,
      prenom: agent.prenom,
      email: agent.email,
      telephone: agent.telephone,
      isAdmin: agent.isAdmin,
      modules: agent.isAdmin ? [] : agent.modules,
    });
    setMutationError(null);
    setFeedback(null);
    setView('edit');
  };

  const updateField = (field: AgentTextField, value: string) => {
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
    if (!form.isAdmin && form.modules.length === 0) {
      setMutationError('Sélectionnez au moins un module pour cet agent.');
      return;
    }
    setMutationError(null);
    setPendingAction({ type: view === 'create' ? 'create' : 'update', form, agentId: selectedAgentId });
  };

  const applyPendingAction = async (action: PendingAction): Promise<Feedback> => {
    if (action.type === 'delete') {
      await deleteAdminAgent(action.agent.id);
      return { tone: 'success', message: `Le compte de ${action.agent.prenom} ${action.agent.nom} a été supprimé.` };
    }

    const payload = {
      nom: action.form.nom,
      prenom: action.form.prenom,
      email: action.form.email,
      telephone: action.form.telephone || null,
      roles: rolesFromAccess(action.form),
    };

    if (action.type === 'create') {
      const created = await createAdminAgent(payload);
      return created.invitationSent
        ? { tone: 'success', message: `Invitation envoyée à ${created.email}.` }
        : { tone: 'warning', message: `Le compte est créé, mais l’e-mail n’a pas pu partir. Ouvrez la fiche de ${created.prenom} pour renvoyer l’invitation.` };
    }

    if (action.agentId !== null) await updateAdminAgent(action.agentId, payload);
    return { tone: 'success', message: `Le compte de ${action.form.prenom} ${action.form.nom} a été modifié.` };
  };

  const confirmAction = async () => {
    if (!pendingAction) return;
    setIsSubmitting(true);
    setMutationError(null);
    try {
      const result = await applyPendingAction(pendingAction);
      await loadAgents();
      setFeedback(result);
      backToList();
    } catch (error: unknown) {
      setMutationError(error instanceof Error ? error.message : 'Impossible de traiter cette action.');
    } finally {
      setPendingAction(null);
      setIsSubmitting(false);
    }
  };

  const resendInvitation = async () => {
    if (!selectedAgent) return;
    setIsResending(true);
    setMutationError(null);
    try {
      await resendAdminAgentInvitation(selectedAgent.id);
      setFeedback({ tone: 'success', message: `Nouvelle invitation envoyée à ${selectedAgent.email}.` });
    } catch (error: unknown) {
      setMutationError(error instanceof Error ? error.message : 'L’invitation n’a pas pu être renvoyée.');
    } finally {
      setIsResending(false);
    }
  };

  const pendingForm = pendingAction && pendingAction.type !== 'delete' ? pendingAction.form : null;
  const pendingAgent = pendingAction?.type === 'delete' ? pendingAction.agent : null;

  const moduleChanges: AgentModuleChange[] =
    pendingForm && selectedAgent && !pendingForm.isAdmin && !selectedAgent.isAdmin
      ? AGENT_MODULES.map((module) => ({
          module: module.id,
          previousState: selectedAgent.modules.includes(module.id),
          nextState: pendingForm.modules.includes(module.id),
        })).filter((change) => change.previousState !== change.nextState)
      : [];

  let confirmationItems: AgentConfirmationItem[] = [];
  if (pendingForm) {
    confirmationItems = [
      { label: 'Nom', value: `${pendingForm.prenom} ${pendingForm.nom}` },
      { label: 'E-mail', value: pendingForm.email },
      { label: 'Téléphone', value: pendingForm.telephone || 'Non renseigné' },
      { label: 'Droits', value: describeAccess(pendingForm) },
    ];
  } else if (pendingAgent) {
    confirmationItems = [
      { label: 'Nom', value: `${pendingAgent.prenom} ${pendingAgent.nom}` },
      { label: 'E-mail', value: pendingAgent.email },
    ];
  }

  const createLabel = view === 'create' ? 'Confirmer la création' : 'Confirmer les modifications';

  if (view !== 'list') {
    const formNotice = (
      <>
        {feedback && <Notice tone={feedback.tone}>{feedback.message}</Notice>}
        {selectedAgent && !selectedAgent.isVerified && (
          <Notice
            tone="info"
            title="Activation en attente"
            action={
              <Button type="button" variant="secondary" size="sm" isLoading={isResending} onClick={() => void resendInvitation()}>
                Renvoyer l’invitation
              </Button>
            }
          >
            Cet agent n’a pas encore choisi son mot de passe : il ne peut pas se connecter.
          </Notice>
        )}
        {mutationError && <Notice tone="danger">{mutationError}</Notice>}
      </>
    );

    return (
      <AdminLayout>
        <section className="mx-auto max-w-328">
          <AgentForm
            mode={view}
            form={form}
            isAdminLocked={isOwnAccount}
            isSubmitting={isSubmitting}
            notice={formNotice}
            onChange={updateField}
            onToggleAdmin={(isAdmin) => setForm((current) => ({ ...current, isAdmin }))}
            onToggleModule={toggleModule}
            onSubmit={saveAgent}
            onCancel={backToList}
            onDelete={selectedAgent && !isOwnAccount ? () => setPendingAction({ type: 'delete', agent: selectedAgent }) : undefined}
          />
          <AgentConfirmationModal
            isOpen={pendingAction !== null}
            title={pendingAgent ? 'Supprimer cet agent' : createLabel}
            description={
              pendingAgent
                ? 'Cette action supprimera le compte de cet agent. Voulez-vous continuer ?'
                : 'Vérifiez les informations avant de confirmer cette opération.'
            }
            items={confirmationItems}
            moduleChanges={moduleChanges}
            confirmLabel={pendingAgent ? 'Confirmer la suppression' : createLabel}
            confirmVariant={pendingAgent ? 'danger' : 'primary'}
            isLoading={isSubmitting}
            onConfirm={confirmAction}
            onClose={() => {
              if (!isSubmitting) setPendingAction(null);
            }}
          />
        </section>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <section className="mx-auto max-w-328 space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <AdminPageHeader title="GESTION DES AGENTS" description="Gérez les accès des agents municipaux aux différents services de la ville." />
          <Button type="button" onClick={openCreate}>
            Ajouter un agent
          </Button>
        </header>

        {feedback && <Notice tone={feedback.tone}>{feedback.message}</Notice>}

        <section aria-labelledby="agents-filter-heading" className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="agents-filter-heading" className="text-label font-bold uppercase tracking-section text-muted">
            Filtrer les agents
          </h2>
          <div className="flex flex-wrap gap-2">
            <FilterTag label="Tous" isSelected={filter === 'all'} onClick={() => setFilter('all')} className={FILTER_TAG_CLASS} />
            <FilterTag label="Administrateur" isSelected={filter === 'admin'} onClick={() => setFilter('admin')} className={FILTER_TAG_CLASS} />
            {AGENT_MODULES.map((module) => (
              <FilterTag
                key={module.id}
                label={module.title}
                isSelected={filter === module.id}
                onClick={() => setFilter(module.id)}
                className={FILTER_TAG_CLASS}
              />
            ))}
          </div>
        </section>

        <section aria-labelledby="agents-list-heading">
          <h2 id="agents-list-heading" className="sr-only">
            Liste des agents
          </h2>
          {isLoading && (
            <p role="status" className="py-12 text-center text-body-sm text-muted">
              Chargement des agents…
            </p>
          )}
          {loadError && <Notice tone="danger">{loadError}</Notice>}
          {!isLoading && !loadError && filteredAgents.length === 0 && (
            <p className="rounded-card border border-dashed border-line px-6 py-10 text-center text-body-sm text-muted">
              Aucun agent ne correspond à ce filtre.
            </p>
          )}
          {!isLoading && !loadError && filteredAgents.length > 0 && (
            <ul className="space-y-4">
              {filteredAgents.map((agent) => (
                <li key={agent.id}>
                  <AgentListCard agent={agent} onSelect={() => openEdit(agent)} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </AdminLayout>
  );
}
