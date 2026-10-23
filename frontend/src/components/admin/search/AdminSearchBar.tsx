'use client';

import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { type Association, getAssociations } from '@/lib/api';
import AdminSearchDropdown from './AdminSearchDropdown';

interface AdminSearchBarProps {
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  className?: string;
}

export default function AdminSearchBar({
  searchTerm = '',
  onSearchChange,
  className = '',
}: AdminSearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(searchTerm);
  const [results, setResults] = useState<Association[]>([]);
  const [totalFound, setTotalFound] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [prevSearchTerm, setPrevSearchTerm] = useState(searchTerm);
  if (searchTerm !== prevSearchTerm) {
    setPrevSearchTerm(searchTerm);
    setQuery(searchTerm);
    if (!searchTerm.trim()) {
      setResults([]);
      setTotalFound(0);
      setIsOpen(false);
    }
  }

  // Recherche avec debounce pour le menu dropdown
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await getAssociations(1, '', trimmed, false, 4);
        setResults(response.items);
        setTotalFound(response.totalItems);
        setIsOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Fermer le dropdown au clic en dehors
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleInputChange = (val: string) => {
    setQuery(val);
    onSearchChange?.(val);
  };

  const handleSelectAssociation = (id: number) => {
    setIsOpen(false);
    router.push(`/admin/association/${id}`);
  };

  const handleFullSearch = (e?: FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = query.trim();
    setIsOpen(false);
    if (onSearchChange) {
      onSearchChange(trimmed);
    }
    router.push(`/admin/association?q=${encodeURIComponent(trimmed)}`);
  };

  const handleClear = () => {
    setQuery('');
    onSearchChange?.('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full max-w-sm sm:max-w-md ${className}`}>
      <form role="search" onSubmit={handleFullSearch} className="relative w-full">
        <label htmlFor="admin-search-input" className="sr-only">
          Rechercher une association
        </label>

        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>

        <input
          id="admin-search-input"
          type="text"
          role="searchbox"
          value={query}
          autoComplete="off"
          onFocus={() => {
            if (query.trim().length > 0) setIsOpen(true);
          }}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Rechercher une association..."
          className="h-10 w-full rounded-pill border-0 bg-white/95 pl-10 pr-9 text-body-sm text-ink placeholder-muted/75 shadow-xs transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Effacer la recherche"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-pill p-1 text-muted hover:text-ink cursor-pointer transition-colors"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </form>

      {isOpen && query.trim().length > 0 && (
        <AdminSearchDropdown
          query={query}
          loading={loading}
          results={results}
          totalFound={totalFound}
          onSelect={handleSelectAssociation}
          onViewAll={() => handleFullSearch()}
        />
      )}
    </div>
  );
}
