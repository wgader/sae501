'use client';

import type { ReactNode } from 'react';
import AgentAccessSelector from '@/components/admin/agent/AgentAccessSelector';
import type { AssociationModule } from '@/components/admin/StatusTag';
import Button from '@/components/ui/Button';
import FormField from '@/components/ui/FormField';
import { IconArrowLeft } from '@/components/ui/icons';
import type { AgentAccess } from '@/lib/agentAccess';

export interface AgentFormState extends AgentAccess {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
}

export type AgentTextField = 'nom' | 'prenom' | 'email' | 'telephone';

interface AgentFormProps {
  mode: 'create' | 'edit';
  form: AgentFormState;
  isAdminLocked: boolean;
  isSubmitting: boolean;
  /** Messages affichés sous le titre (invitation en attente, erreur…). */
  notice?: ReactNode;
  onChange: (field: AgentTextField, value: string) => void;
  onToggleAdmin: (isAdmin: boolean) => void;
  onToggleModule: (module: AssociationModule) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export default function AgentForm({
  mode,
  form,
  isAdminLocked,
  isSubmitting,
  notice,
  onChange,
  onToggleAdmin,
  onToggleModule,
  onSubmit,
  onCancel,
  onDelete,
}: AgentFormProps) {
  const isEdit = mode === 'edit';

  return (
    <form
      method="post"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="space-y-8"
    >
      <header className="border-b border-line pb-5">
        <button
          type="button"
          onClick={onCancel}
          className="mb-4 inline-flex cursor-pointer items-center gap-1.5 text-meta font-bold uppercase tracking-label text-muted transition-colors hover:text-ink"
        >
          <IconArrowLeft />
          Liste des agents
        </button>
        <h1 className="text-2xl font-black uppercase tracking-wider text-ink sm:text-3xl">
          {isEdit ? 'Modifier un agent' : 'Ajouter un agent'}
        </h1>
        {!isEdit && (
          <p className="mt-2 text-body-sm text-muted">
            L’agent recevra un e-mail pour choisir lui-même son mot de passe. Le lien est valable 72 heures.
          </p>
        )}
      </header>

      {notice}

      <div className="grid gap-8 xl:grid-cols-2">
        <section aria-labelledby="agent-information-heading">
          <h2 id="agent-information-heading" className="text-base font-bold tracking-section text-ink">
            Identité et contact
          </h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <FormField label="Prénom" value={form.prenom} onChange={(event) => onChange('prenom', event.target.value)} placeholder="exemple : Camille" />
            <FormField label="Nom de famille" value={form.nom} onChange={(event) => onChange('nom', event.target.value)} placeholder="exemple : Dupont" />
            <FormField label="Adresse e-mail" type="email" value={form.email} onChange={(event) => onChange('email', event.target.value)} placeholder="exemple : monadresse@domaine.fr" />
            <FormField label="Téléphone" required={false} value={form.telephone} onChange={(event) => onChange('telephone', event.target.value)} placeholder="exemple : 05 XX XX XX XX" />
          </div>
        </section>

        <section aria-label="Droits d’accès" className="border-t border-line pt-8 xl:border-l xl:border-t-0 xl:pl-8 xl:pt-0">
          <AgentAccessSelector
            access={form}
            isAdminLocked={isAdminLocked}
            onToggleAdmin={onToggleAdmin}
            onToggleModule={onToggleModule}
          />
        </section>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
        <div className="flex flex-wrap gap-3">
          <Button type="submit" size="sm" isLoading={isSubmitting}>
            {isEdit ? 'Enregistrer les modifications' : 'Créer et envoyer l’invitation'}
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
