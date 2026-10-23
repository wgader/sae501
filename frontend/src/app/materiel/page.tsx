'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Equipment, getPublicEquipment, getMediaUrl } from '@/lib/api';

const CATEGORIES = [
  { value: '', label: 'Toutes les catégories' },
  { value: 'mobilier', label: 'Mobilier' },
  { value: 'sonorisation', label: 'Sonorisation & Audio' },
  { value: 'barnums', label: 'Barnums & Tentes' },
  { value: 'eclairage', label: 'Éclairage' },
  { value: 'autre', label: 'Autre matériel' },
];

export default function MaterielPage() {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brokenImageIds, setBrokenImageIds] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoading(true);
        setError(null);
        const data = await getPublicEquipment();
        setEquipmentList(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Impossible de charger le catalogue de matériel.');
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, []);

  const filtered = useMemo(() => {
    return equipmentList.filter((item) => {
      if (selectedCategory && item.categorie !== selectedCategory) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          item.designation.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [equipmentList, selectedCategory, search]);

  return (
    <main className="min-h-screen bg-white px-6 py-8 sm:px-10 lg:px-14 lg:py-10">
      <div className="mx-auto max-w-328 space-y-8">
        <header className="border-b border-line pb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-label font-bold uppercase tracking-eyebrow text-primary">
              Espace associations · Prêt communal
            </p>
            <h1 className="mt-2 text-[clamp(2rem,3.5vw,2.75rem)] font-black tracking-display text-ink">
              Catalogue de matériel municipal
            </h1>
            <p className="mt-2 max-w-2xl text-body leading-copy text-muted">
              Consultez les équipements municipaux disponibles au prêt pour vos manifestations et événements associatifs.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-line px-5 text-xs font-bold uppercase tracking-label text-ink hover:bg-paper"
          >
            ← Retour au tableau de bord
          </Link>
        </header>

        {/* Filtres de recherche */}
        <section aria-labelledby="catalog-filters" className="rounded-2xl border border-line bg-paper p-5">
          <h2 id="catalog-filters" className="sr-only">Filtrer les équipements</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="catalog-search" className="block text-xs font-bold uppercase tracking-wider text-muted">
                Rechercher un matériel
              </label>
              <input
                id="catalog-search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ex: Barnum, table, micro..."
                className="mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2 text-sm text-ink focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="catalog-cat" className="block text-xs font-bold uppercase tracking-wider text-muted">
                Catégorie
              </label>
              <select
                id="catalog-cat"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2 text-sm text-ink focus:border-primary focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Liste du catalogue */}
        <section aria-labelledby="catalog-items-heading">
          <h2 id="catalog-items-heading" className="sr-only">Équipements disponibles</h2>

          {loading ? (
            <div className="rounded-2xl border border-line bg-paper p-12 text-center text-sm font-semibold text-muted">
              Chargement des équipements disponibles...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm font-semibold text-danger">
              {error}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-line bg-paper p-12 text-center">
              <p className="text-base font-bold text-ink">Aucun équipement disponible</p>
              <p className="mt-1 text-xs text-muted">
                Modifiez vos filtres ou contactez le service logistique municipal pour toute demande spécifique.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item) => (
                <article
                  key={item.id}
                  className="group flex flex-col justify-between overflow-hidden rounded-[20px] border border-[var(--line)] bg-white shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-[var(--Mosaic-Tile)]/40 hover:shadow-md"
                >
                  <div>
                    {/* Image / Thumbnail avec badges */}
                    <div className="relative flex h-52 sm:h-56 w-full items-center justify-center overflow-hidden bg-[var(--Pale-Sage)] border-b border-[var(--line)]">
                      {item.imagePath && !brokenImageIds.includes(item.id) ? (
                        <Image
                          src={getMediaUrl(item.imagePath)!}
                          alt={`Photo de ${item.designation}`}
                          fill
                          unoptimized
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={() =>
                            setBrokenImageIds((prev) =>
                              prev.includes(item.id) ? prev : [...prev, item.id],
                            )
                          }
                        />
                      ) : (
                        <div
                          className="flex h-full w-full flex-col items-center justify-center bg-[var(--Pale-Sage)] text-[var(--Mosaic-Tile)]"
                          role="img"
                          aria-label={`Illustration pour ${item.designation}`}
                        >
                          <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[var(--Mosaic-Tile)]/20 bg-white/70 shadow-xs transition-transform duration-300 group-hover:scale-110">
                            <svg
                              className="h-8 w-8 text-[var(--Mosaic-Tile)]"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                              <line x1="12" y1="22.08" x2="12" y2="12" />
                            </svg>
                          </span>
                          <span className="mt-2 text-xs font-semibold text-[var(--Mosaic-Tile)]/80">
                            Photo illustrative
                          </span>
                        </div>
                      )}

                      {/* Badges Catégorie et Statut */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
                        <span className="rounded-full bg-white/95 backdrop-blur-xs px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--Mosaic-Tile)] border border-[var(--line)] shadow-2xs">
                          {item.categorie}
                        </span>

                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-800 shadow-2xs">
                          Disponible
                        </span>
                      </div>
                    </div>

                    {/* Contenu */}
                    <div className="p-6">
                      {item.referenceInterne && (
                        <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-[var(--muted)] mb-1.5">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--Mosaic-Tile)]/60" />
                          <span>Réf : {item.referenceInterne}</span>
                        </div>
                      )}

                      <h3 className="text-lg font-bold text-[var(--ink)] leading-snug transition-colors group-hover:text-[var(--Mosaic-Tile)]">
                        {item.designation}
                      </h3>

                      {item.description && (
                        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--muted)]">
                          {item.description}
                        </p>
                      )}

                      {item.consignesUtilisation && (
                        <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-3 text-xs leading-relaxed text-[var(--ink)]/85">
                          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[var(--muted)] text-[10px]">
                            <svg className="h-3.5 w-3.5 text-[var(--Mosaic-Tile)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="8" x2="12" y2="12" />
                              <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            Consignes d&apos;utilisation
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs">{item.consignesUtilisation}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stock footer */}
                  <footer className="border-t border-[var(--line)] bg-[var(--paper)]/50 p-6 pt-4 flex items-baseline justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                      Parc communal disponible
                    </span>
                    <p className="text-xl font-black text-[var(--Mosaic-Tile)]">
                      {item.stockTotal}{' '}
                      <span className="text-xs font-medium text-[var(--muted)]">unités</span>
                    </p>
                  </footer>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
