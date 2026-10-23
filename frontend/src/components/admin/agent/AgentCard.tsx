export interface MunicipalAgent {
  id: number;
  nom: string;
  prenom: string;
  initials: string;
  email: string;
  role: string;
  service: string;
}

interface AgentCardProps {
  agent: MunicipalAgent;
}

export default function AgentCard({ agent }: AgentCardProps) {
  return (
    <article className="flex items-center justify-between gap-4 rounded-card border border-line bg-paper p-5 sm:p-6 transition hover:border-primary/40 hover:shadow-xs">
      <header className="flex items-center gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill bg-accent text-xs font-black text-ink">
          {agent.initials}
        </span>

        <div>
          <h3 className="text-sm sm:text-base font-bold text-ink">
            {agent.prenom} {agent.nom}
          </h3>
          <p className="text-xs text-muted">
            {agent.service} · {agent.email}
          </p>
        </div>
      </header>

      <span className="rounded-pill bg-primary px-3 py-1 text-xs font-bold text-white">
        {agent.role}
      </span>
    </article>
  );
}
