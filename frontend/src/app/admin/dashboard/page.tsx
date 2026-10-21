'use client';

import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminMetricCard from '@/components/admin/AdminMetricCard';
import AssociationCard from '@/components/admin/association/AssociationCard';
import { useAssociations } from '@/hooks/useAssociations';

export default function AdminDashboardPage() {
  const { associations: pendingItems, counts, loading } = useAssociations(1, 'PENDING_VALIDATION');

  const pendingCount = counts?.pending ?? 0;
  const validatedCount = counts?.validated ?? 0;
  const totalCount = counts?.total ?? 0;

  return (
    <AdminLayout>
      <section className="mx-auto max-w-5xl space-y-10">
        <AdminPageHeader
          title="Tableau de bord"
          description="Supervision générale des structures associatives, instruction des demandes d’adhésion et gestion des services communaux."
        />

        {/* ── Indicateurs clés (KPI) ───────────────────────── */}
        <section aria-labelledby="metrics-heading">
          <h2 id="metrics-heading" className="sr-only">
            Indicateurs clés
          </h2>

          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 p-0 list-none">
            <li>
              <AdminMetricCard
                title="Demandes en attente"
                value={pendingCount}
                description="Dossiers nécessitant une décision d'approbation par un agent."
                icon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                iconBgClass="bg-[var(--Lime-Cream)] text-[var(--ink)]"
                actionHref="/admin/inscription"
                actionLabel="Traiter les demandes"
                loading={loading}
              />
            </li>

            <li>
              <AdminMetricCard
                title="Associations validées"
                value={validatedCount}
                description="Comptes habilités à réserver les salles et solliciter des aides."
                icon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                iconBgClass="bg-emerald-100 text-emerald-800"
                actionHref="/admin/inscription"
                actionLabel="Consulter la liste"
                loading={loading}
              />
            </li>

            <li>
              <AdminMetricCard
                title="Total des structures"
                value={totalCount}
                description="Nombre total d'associations déclarées auprès de la commune."
                icon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                  </svg>
                }
                iconBgClass="bg-[var(--Mosaic-Tile)]/15 text-[var(--Mosaic-Tile)]"
                actionHref="/admin/inscription"
                actionLabel="Voir tout l'annuaire"
                loading={loading}
              />
            </li>
          </ul>
        </section>

        {/* ── Aperçu des dernières demandes en attente ─────── */}
        <section aria-labelledby="pending-requests-heading">
          <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 id="pending-requests-heading" className="text-base font-bold uppercase tracking-wider text-[var(--ink)]">
              Dernières demandes à instruire
            </h2>

            <Link
              href="/admin/inscription"
              className="group inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--Mosaic-Tile)] hover:underline"
            >
              <span>Accéder à toutes les inscriptions</span>
              <svg className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </header>

          {loading ? (
            <article className="py-12 text-center text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              Chargement des dossiers...
            </article>
          ) : pendingItems.length === 0 ? (
            <article className="rounded-[20px] border border-[var(--line)] bg-[var(--paper)] p-8 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </span>
              <h3 className="mt-3 text-sm font-bold text-[var(--ink)]">
                Toutes les demandes sont à jour !
              </h3>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Il n&apos;y a aucune demande d&apos;inscription en attente de traitement actuellement.
              </p>
            </article>
          ) : (
            <ul className="space-y-3 p-0 list-none">
              {pendingItems.slice(0, 4).map((assoc) => (
                <li key={assoc.id}>
                  <AssociationCard association={assoc} compact />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── Raccourcis des modules municipaux ────────────── */}
        <section aria-labelledby="modules-shortcuts-heading">
          <h2 id="modules-shortcuts-heading" className="text-base font-bold uppercase tracking-wider text-[var(--ink)] mb-4">
            Services & modules municipaux
          </h2>

          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 p-0 list-none">
            <li>
              <Link
                href="/admin/module"
                className="group flex items-start gap-4 rounded-[20px] border border-[var(--line)] bg-[var(--paper)] p-5 transition hover:border-[var(--Mosaic-Tile)]/40 hover:shadow-sm"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--Mosaic-Tile)] text-[var(--White)]">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <rect x="3" y="3" width="7" height="7" rx="1.5" />
                    <rect x="14" y="3" width="7" height="7" rx="1.5" />
                    <rect x="14" y="14" width="7" height="7" rx="1.5" />
                    <rect x="3" y="14" width="7" height="7" rx="1.5" />
                  </svg>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-[var(--ink)] group-hover:text-[var(--Mosaic-Tile)] transition-colors">
                    Modules & Démarches
                  </span>
                  <span className="mt-0.5 block text-xs text-[var(--muted)]">
                    Supervision des subventions, salles municipales et prêt de matériel.
                  </span>
                </span>
                <svg className="h-4 w-4 shrink-0 text-[var(--muted)] transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[var(--Mosaic-Tile)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </li>

            <li>
              <Link
                href="/admin/agent"
                className="group flex items-start gap-4 rounded-[20px] border border-[var(--line)] bg-[var(--paper)] p-5 transition hover:border-[var(--Mosaic-Tile)]/40 hover:shadow-sm"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--Lime-Cream)] text-[var(--ink)]">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-[var(--ink)] group-hover:text-[var(--Mosaic-Tile)] transition-colors">
                    Agents communaux
                  </span>
                  <span className="mt-0.5 block text-xs text-[var(--muted)]">
                    Consulter la liste des agents municipaux habilités aux validations.
                  </span>
                </span>
                <svg className="h-4 w-4 shrink-0 text-[var(--muted)] transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[var(--Mosaic-Tile)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </li>
          </ul>
        </section>
      </section>
    </AdminLayout>
  );
}