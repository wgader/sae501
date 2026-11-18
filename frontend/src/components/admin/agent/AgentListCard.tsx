import StatusTag from '@/components/admin/StatusTag';
import { IconChevronRight } from '@/components/ui/icons';
import type { AgentAccess } from '@/lib/agentAccess';

export interface AgentSummary extends AgentAccess {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  isVerified: boolean;
}

interface AgentListCardProps {
  agent: AgentSummary;
  onSelect: () => void;
}

export default function AgentListCard({ agent, onSelect }: AgentListCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full cursor-pointer items-center justify-between gap-5 rounded-card border border-line bg-white p-5 text-left transition hover:border-primary/40 hover:shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <span className="min-w-0">
        <span className="block truncate text-base font-bold text-ink">
          {agent.prenom} {agent.nom}
        </span>
        <span className="mt-1 block truncate text-body-sm text-muted">{agent.email}</span>
        <span className="mt-4 flex flex-wrap gap-2">
          {agent.isAdmin ? (
            <span className="inline-flex items-center rounded-pill bg-ink px-3 py-2 text-caption font-bold uppercase tracking-widest text-white">
              Administrateur
            </span>
          ) : (
            agent.modules.map((module) => <StatusTag key={module} status={module} />)
          )}
          {!agent.isVerified && (
            <span className="inline-flex items-center rounded-pill bg-accent px-3 py-2 text-caption font-bold uppercase tracking-widest text-ink">
              Activation en attente
            </span>
          )}
        </span>
      </span>
      <IconChevronRight className="h-5 w-5 shrink-0 text-muted" />
    </button>
  );
}
