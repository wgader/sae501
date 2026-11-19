import type { Metadata } from 'next';
import { Suspense } from 'react';
import RequestDetailPage from '@/components/historique/RequestDetailPage';

export const metadata: Metadata = {
  title: 'Détail de la démarche · Espace associations | Feytiat',
};

export default function HistoriqueRequestPage() {
  return (
    <Suspense>
      <RequestDetailPage />
    </Suspense>
  );
}
