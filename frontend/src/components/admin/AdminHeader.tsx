'use client';

interface AdminHeaderProps {
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export default function AdminHeader({
  searchTerm = '',
  onSearchChange,
  onToggleMobileMenu,
  isMobileMenuOpen = false,
}: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between bg-primary px-6 lg:px-10">
      <div className="flex flex-1 items-center gap-4">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          aria-label={isMobileMenuOpen ? 'Fermer le menu de navigation' : 'Ouvrir le menu de navigation'}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20 lg:hidden"
        >
          {isMobileMenuOpen ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        <form role="search" onSubmit={(e) => e.preventDefault()} className="relative w-full max-w-sm sm:max-w-md">
          <label htmlFor="admin-search-input" className="sr-only">
            Rechercher une association
          </label>
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            id="admin-search-input"
            type="search"
            value={searchTerm}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Rechercher une association"
            className="h-10 w-full rounded-full border-0 bg-white/95 pl-10 pr-4 text-body-sm text-ink placeholder:text-muted/75 shadow-xs transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </form>
      </div>

      <div className="flex items-center pl-4">
        <div className="flex items-center gap-2.5 rounded-full bg-white px-3 py-1.5 shadow-xs">
          <span className="flex size-7 items-center justify-center rounded-full bg-accent text-label font-black text-ink">
            AF
          </span>
          <span className="hidden text-xs font-bold text-ink sm:inline">
            Alain Faure
          </span>
        </div>
      </div>
    </header>
  );
}
