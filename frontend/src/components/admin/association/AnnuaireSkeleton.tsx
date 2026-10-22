export default function AnnuaireSkeleton() {
  return (
    <ul
      className="grid grid-cols-1 gap-5 p-0 list-none sm:grid-cols-2 min-[1200px]:grid-cols-3"
      aria-label="Chargement des associations"
      aria-busy="true"
    >
      {Array.from({ length: 6 }).map((_, idx) => (
        <li key={idx} className="h-full">
          <article className="flex h-full flex-col justify-between overflow-hidden rounded-[20px] border border-[var(--line)] bg-[var(--White)] shadow-xs animate-pulse">
            {/* Image Placeholder */}
            <figure className="relative flex h-56 w-full items-center justify-center overflow-hidden bg-[var(--Pale-Sage)] sm:h-64">
              <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[var(--Mosaic-Tile)]/20 bg-[var(--White)]/60 shadow-xs">
                <span className="h-8 w-8 rounded-full bg-[var(--Mosaic-Tile)]/20" />
              </span>
            </figure>

            {/* Content Placeholder */}
            <section className="flex flex-1 flex-col justify-between p-5">
              <header className="mb-3 space-y-2">
                <div className="h-5 w-3/4 rounded-md bg-[var(--line)]" />
                <div className="h-3 w-1/3 rounded-md bg-[var(--line)]/60" />
              </header>

              <ul className="m-0 list-none space-y-2.5 p-0">
                <li className="flex items-center gap-2.5">
                  <span className="h-4 w-4 shrink-0 rounded-full bg-[var(--Mosaic-Tile)]/20" />
                  <span className="h-3.5 w-1/2 rounded bg-[var(--line)]" />
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="h-4 w-4 shrink-0 rounded-full bg-[var(--Mosaic-Tile)]/20" />
                  <span className="h-3.5 w-2/5 rounded bg-[var(--line)]" />
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="h-4 w-4 shrink-0 rounded-full bg-[var(--Mosaic-Tile)]/20" />
                  <span className="h-3.5 w-3/5 rounded bg-[var(--line)]" />
                </li>
              </ul>

              <footer className="mt-3.5 flex items-center justify-end">
                <span className="h-8 w-8 rounded-full bg-[var(--line)]/60" />
              </footer>
            </section>
          </article>
        </li>
      ))}
    </ul>
  );
}
