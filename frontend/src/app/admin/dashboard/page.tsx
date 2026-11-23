'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminWelcome from '@/components/admin/dashboard/AdminWelcome';
import AgendaList from '@/components/admin/dashboard/AgendaList';
import CampaignStatusCard from '@/components/admin/dashboard/CampaignStatusCard';
import DashboardSection from '@/components/admin/dashboard/DashboardSection';
import LatestRegistrations from '@/components/admin/dashboard/LatestRegistrations';
import PendingQueueCard from '@/components/admin/dashboard/PendingQueueCard';
import Notice from '@/components/ui/Notice';
import { PENDING_QUEUES } from '@/lib/adminDashboard';
import { getAdminDashboard } from '@/lib/api';
import type { AdminDashboard } from '@/lib/api/types';
import { logger } from '@/lib/logger';
import { readSession } from '@/lib/session';

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [failed, setFailed] = useState(false);
  // Figés au montage : le rendu serveur ne connaît ni la session ni l'heure du navigateur.
  const [firstName, setFirstName] = useState<string | null>(null);
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    document.title = 'Administration · Accueil | Ville de Feytiat';
    let active = true;
    const timeoutId = window.setTimeout(() => {
      setFirstName(readSession()?.user.prenom ?? null);
      setToday(new Date());
    }, 0);
    getAdminDashboard()
      .then((data) => {
        if (active) setDashboard(data);
      })
      .catch((error: unknown) => {
        logger.error('Chargement de l’accueil administrateur impossible', error);
        if (active) setFailed(true);
      });
    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-8">
        <AdminWelcome firstName={firstName} today={today} dashboard={dashboard} />

        {failed && <Notice tone="danger">Impossible de charger les chiffres du jour. Rechargez la page dans un instant.</Notice>}

        <section aria-labelledby="queues-heading">
          <header className="mb-4">
            <p className="text-label font-bold uppercase tracking-eyebrow text-muted">À traiter</p>
            <h2 id="queues-heading" className="mt-1 text-2xl font-black tracking-subheading text-ink">
              Ce qui attend votre décision
            </h2>
          </header>

          <ul className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
            {PENDING_QUEUES.map((queue, index) => (
              <li key={queue.key} className={index === 0 ? 'col-span-2 xl:col-span-1' : undefined}>
                {dashboard ? (
                  <PendingQueueCard queue={queue} count={dashboard.pending[queue.key]} />
                ) : (
                  <div className="h-full min-h-52 animate-pulse rounded-card bg-paper" aria-hidden="true" />
                )}
              </li>
            ))}
          </ul>
        </section>

        <div className="grid gap-6 lg:grid-cols-5">
          <DashboardSection
            id="agenda-heading"
            eyebrow="Les 7 prochains jours"
            title="Agenda de la commune"
            link={{ href: '/admin/campagnes', label: 'Planning des salles' }}
            className="lg:col-span-3"
          >
            {dashboard ? <AgendaList items={dashboard.agenda} /> : <p className="text-body-sm text-muted">Chargement…</p>}
          </DashboardSection>

          <div className="space-y-6 lg:col-span-2">
            <DashboardSection
              id="registrations-heading"
              eyebrow="Nouvelles associations"
              title="Inscriptions récentes"
              link={{ href: '/admin/inscription', label: 'Toutes' }}
            >
              {dashboard ? (
                <LatestRegistrations registrations={dashboard.latestRegistrations} now={today ?? new Date()} />
              ) : (
                <p className="text-body-sm text-muted">Chargement…</p>
              )}
            </DashboardSection>

            {dashboard && <CampaignStatusCard campaign={dashboard.campaign} />}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
