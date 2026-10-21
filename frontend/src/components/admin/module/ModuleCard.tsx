export interface MunicipalModule {
  id: string;
  title: string;
  tag: string;
  description: string;
  status: string;
}

interface ModuleCardProps {
  module: MunicipalModule;
}

export default function ModuleCard({ module }: ModuleCardProps) {
  return (
    <article className="flex h-full flex-col justify-between rounded-[20px] border border-[var(--line)] bg-[var(--paper)] p-6 transition hover:border-[var(--Mosaic-Tile)]/40 hover:shadow-md">
      <header>
        <span className="flex items-center justify-between">
          <span className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-[var(--Mosaic-Tile)]">
            {module.tag}
          </span>
          <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-800">
            {module.status}
          </span>
        </span>

        <h3 className="mt-4 text-lg font-bold text-[var(--ink)]">
          {module.title}
        </h3>

        <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
          {module.description}
        </p>
      </header>

      <footer className="mt-6 border-t border-[var(--line)] pt-4 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
        <span>Activé par défaut</span>
        <span className="text-[var(--Mosaic-Tile)] font-semibold">Configuré</span>
      </footer>
    </article>
  );
}
