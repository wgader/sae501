'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Equipment, getPublicEquipment } from '@/lib/api';

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
                  className="flex flex-col justify-between rounded-2xl border border-line bg-paper p-6 transition hover:border-primary/40 hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-sage px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-primary">
                        {item.categorie}
                      </span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 rounded-full px-2.5 py-0.5">
                        Disponible
                      </span>
                    </div>

                    <div className="mt-4 flex h-40 w-full items-center justify-center overflow-hidden rounded-xl bg-white border border-line">
                      {item.imagePath ? (
                        <Image
                          src={item.imagePath}
                          alt={item.designation}
                          width={320}
                          height={160}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-muted">
                          <svg className="h-10 w-10 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                          <span className="mt-1 text-meta">Photo illustrative</span>
                        </div>
                      )}
                    </div>

                    <h3 className="mt-4 text-lg font-bold text-ink">
                      {item.designation}
                    </h3>
                    {item.description && (
                      <p className="mt-2 text-xs leading-relaxed text-muted">
                        {item.description}
                      </p>
                    )}

                    {item.consignesUtilisation && (
                      <div className="mt-4 rounded-xl bg-white p-3 text-xs border border-line">
                        <span className="font-bold text-ink block">Consignes :</span>
                        <p className="text-muted mt-0.5">{item.consignesUtilisation}</p>
                      </div>
                    )}
                  </div>

                  <footer className="mt-6 border-t border-line pt-4 flex items-center justify-between text-xs">
                    <span className="font-bold text-muted uppercase tracking-wider">
                      Quantité communale
                    </span>
                    <span className="font-black text-sm text-primary">
                      {item.stockTotal} unités
                    </span>
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
