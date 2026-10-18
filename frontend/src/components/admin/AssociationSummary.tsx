'use client';

import { useEffect, useRef, useState } from 'react';
import { getAssociations, type Association } from '@/lib/api';

type SummaryTab = 'subventions' | 'materiel';

type AssociationSummaryProps = {
  role?: 'admin' | 'subventions' | 'materiel';
};

const tabs: Array<{ id: SummaryTab; label: string; description: string }> = [
  { id: 'subventions', label: 'Subventions', description: 'Dossiers déposés et décisions' },
  { id: 'materiel', label: 'Emprunts de matériel', description: 'Réservations et restitutions' },
];

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="m21 21-4.35-4.35m1.35-5.4a6.75 6.75 0 1 1-13.5 0 6.75 6.75 0 0 1 13.5 0Z" />
    </svg>
  );
}

function SummarySkeleton() {
  return (
    <div className="animate-pulse space-y-5" aria-label="Chargement de la fiche" role="status">
      <div className="h-8 w-2/5 rounded bg-slate-200" />
      <div className="h-24 rounded-xl bg-slate-100" />
      <div className="h-48 rounded-xl bg-slate-100" />
    </div>
  );
}

function EmptyHistory({ type }: { type: 'subventions' | 'materiel' }) {
  const isGrant = type === 'subventions';
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#0b644d] shadow-sm">
        {isGrant ? '€' : '▣'}
      </div>
      <h3 className="font-semibold text-slate-900">
        Aucun {isGrant ? 'dossier de subvention' : 'emprunt de matériel'}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
        L’historique de cette association s’affichera ici dès que les données seront disponibles.
      </p>
    </div>
  );
}

export default function AssociationSummary({ role = 'admin' }: AssociationSummaryProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Association[]>([]);
  const [selected, setSelected] = useState<Association | null>(null);
  const [activeTab, setActiveTab] = useState<SummaryTab>(role === 'materiel' ? 'materiel' : 'subventions');
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  const visibleTabs = role === 'admin' ? tabs : tabs.filter((tab) => tab.id === role);

  useEffect(() => {
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 2) {
      const clearSuggestions = window.setTimeout(() => {
        setSuggestions([]);
        setLoadingSuggestions(false);
      }, 0);
      return () => window.clearTimeout(clearSuggestions);
    }

    const timeout = window.setTimeout(async () => {
      const currentRequest = ++requestId.current;
      setLoadingSuggestions(true);
      setError('');
      try {
        const result = await getAssociations(1, '', normalizedQuery);
        if (currentRequest === requestId.current) setSuggestions(result.items);
      } catch (cause) {
        if (currentRequest === requestId.current) {
          setError(cause instanceof Error ? cause.message : 'Impossible de rechercher une association.');
          setSuggestions([]);
        }
      } finally {
        if (currentRequest === requestId.current) setLoadingSuggestions(false);
      }
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [query]);

  function selectAssociation(association: Association) {
    setQuery(association.nom);
    setSuggestions([]);
    setLoadingSummary(true);
    setSelected(null);
    setActiveTab(role === 'materiel' ? 'materiel' : 'subventions');
    setError('');

    // The detail endpoint will populate these sections when the back is available.
    window.setTimeout(() => {
      setSelected(association);
      setLoadingSummary(false);
    }, 250);
  }

  return (
    <section className="space-y-7" aria-label="Recherche et historique des associations">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0b644d]">Recherche association</p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900">Consulter une fiche récapitulative</h2>
          <p className="mt-1 text-sm text-slate-500">Recherchez par nom, numéro RNA ou numéro SIREN.</p>
        </div>

        <div className="relative">
          <label className="sr-only" htmlFor="association-search">Rechercher une association</label>
          <div className="flex items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 transition focus-within:border-[#0b644d] focus-within:ring-2 focus-within:ring-[#0b644d]/15">
            <span className="text-slate-400"><SearchIcon /></span>
            <input
              id="association-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Escape') setSuggestions([]); }}
              placeholder="Rechercher une association"
              autoComplete="off"
              className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
            {loadingSuggestions && <span className="text-xs text-slate-400">Recherche…</span>}
          </div>

          {query.trim().length >= 2 && !loadingSuggestions && (
            <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
              {suggestions.length > 0 ? suggestions.map((association) => (
                <button
                  type="button"
                  key={association.id}
                  onClick={() => selectAssociation(association)}
                  className="flex w-full items-center justify-between border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-[#f2f7f5] focus:bg-[#f2f7f5] focus:outline-none"
                >
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">{association.nom}</span>
                    <span className="mt-1 block text-xs text-slate-500">RNA {association.numeroRna || '—'}</span>
                  </span>
                  <span className="text-[#0b644d]">→</span>
                </button>
              )) : (
                <p className="px-4 py-4 text-sm text-slate-500">Aucune association trouvée pour « {query.trim()} ».</p>
              )}
            </div>
          )}
        </div>
        {error && <p className="mt-3 text-sm text-red-700" role="alert">{error}</p>}
      </div>

      {loadingSummary && <SummarySkeleton />}

      {!loadingSummary && selected && (
        <div className="space-y-5">
          <header className="rounded-2xl bg-[#0b644d] p-6 text-white shadow-sm sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">Fiche association</p>
            <h2 className="mt-2 text-2xl font-bold">{selected.nom}</h2>
            <p className="mt-2 text-sm text-emerald-50">RNA {selected.numeroRna || 'Non renseigné'}</p>
          </header>

          <div className="border-b border-slate-200">
            <div className="flex gap-6 overflow-x-auto">
              {visibleTabs.map((tab) => (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`border-b-2 px-1 py-3 text-left transition ${activeTab === tab.id ? 'border-[#0b644d] text-[#0b644d]' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
                >
                  <span className="block text-sm font-semibold">{tab.label}</span>
                  <span className="mt-1 block whitespace-nowrap text-xs">{tab.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <EmptyHistory type={activeTab} />
          </div>
        </div>
      )}
    </section>
  );
}
