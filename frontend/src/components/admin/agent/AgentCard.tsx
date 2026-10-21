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
    <article className="flex items-center justify-between gap-4 rounded-[18px] border border-[var(--line)] bg-[var(--paper)] p-5 sm:p-6 transition hover:border-[var(--Mosaic-Tile)]/40 hover:shadow-sm">
      <header className="flex items-center gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--Lime-Cream)] text-xs font-black text-[var(--ink)]">
          {agent.initials}
        </span>

        <span>
          <h3 className="text-sm sm:text-base font-bold text-[var(--ink)]">
            {agent.prenom} {agent.nom}
          </h3>
          <p className="text-xs text-[var(--muted)]">
            {agent.service} · {agent.email}
          </p>
        </span>
      </header>

      <span className="rounded-full bg-[var(--Mosaic-Tile)] px-3 py-1 text-xs font-bold text-[var(--White)]">
        {agent.role}
      </span>
    </article>
  );
}
