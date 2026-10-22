'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconChevronLeft } from '@/components/ui/icons';

export type AssociationTab = 'INFORMATIONS' | 'DOCUMENTS' | 'HISTORIQUE' | 'ÉVÉNEMENTS';

interface AssociationTopNavProps {
  id: number;
  nom: string;
  searchQuery?: string;
}

interface NavTabItem {
  key: AssociationTab;
  label: string;
  href: string;
}

export default function AssociationTopNav({
  id,
  nom,
  searchQuery,
}: AssociationTopNavProps) {
  const pathname = usePathname();

  const tabs: NavTabItem[] = [
    { key: 'INFORMATIONS', label: 'INFORMATIONS', href: `/admin/association/${id}` },
    { key: 'DOCUMENTS', label: 'DOCUMENTS', href: `/admin/association/${id}/documents` },
    { key: 'HISTORIQUE', label: 'HISTORIQUE', href: `/admin/association/${id}/historique` },
    { key: 'ÉVÉNEMENTS', label: 'ÉVÉNEMENTS', href: `/admin/association/${id}/evenements` },
  ];

  const isTabActive = (href: string) => {
    if (href === `/admin/association/${id}`) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="space-y-6">
      <nav aria-label="Fil d'ariane" className="flex flex-wrap items-center justify-between gap-4 text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
        <Link
          href="/admin/association"
          className="inline-flex items-center gap-1.5 transition-colors hover:text-[var(--Mosaic-Tile)] cursor-pointer"
        >
          <IconChevronLeft className="h-3.5 w-3.5" />
          <span>ANNUAIRE DES ASSOCIATIONS</span>
        </Link>

        {searchQuery ? (
          <Link
            href={`/admin/association?q=${encodeURIComponent(searchQuery)}`}
            className="inline-flex items-center gap-1.5 text-[var(--muted)] transition-colors hover:text-[var(--Mosaic-Tile)] cursor-pointer"
          >
            <IconChevronLeft className="h-3.5 w-3.5" />
            <span>Résultats pour « {searchQuery} »</span>
          </Link>
        ) : null}
      </nav>

      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-[var(--ink)] sm:text-3xl">
          {nom}
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Informations de l’association et suivi de ses démarches auprès de la municipalité.
        </p>
      </div>

      <nav aria-label="Sections du dossier association" className="border-b border-[var(--line)] pb-4">
        <ul className="m-0 flex flex-wrap items-center gap-2.5 p-0 list-none">
          {tabs.map((tab) => {
            const active = isTabActive(tab.href);
            return (
              <li key={tab.key}>
                <Link
                  href={tab.href}
                  className={`inline-block rounded-[8px] px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    active
                      ? 'bg-[var(--Mosaic-Tile)] text-[var(--White)] shadow-xs'
                      : 'border border-[var(--Mosaic-Tile)] bg-transparent text-[var(--Mosaic-Tile)] hover:bg-[var(--Pale-Sage)]/40'
                  }`}
                >
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
