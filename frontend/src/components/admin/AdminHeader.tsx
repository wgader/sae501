'use client';

import AdminSearchBar from '@/components/admin/search/AdminSearchBar';

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
    <header className="flex h-20 w-full items-center justify-between bg-[var(--Mosaic-Tile)] px-6 lg:px-10">
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

        <AdminSearchBar
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
        />
      </div>

      <div className="flex items-center pl-4">
        <div className="flex items-center gap-2.5 rounded-full bg-[var(--White)] px-3 py-1.5 shadow-xs">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--Lime-Cream)] text-[0.6875rem] font-black text-[var(--ink)]">
            AF
          </span>
          <span className="hidden text-xs font-bold text-[var(--ink)] sm:inline">
            Alain Faure
          </span>
        </div>
      </div>
    </header>
  );
}
