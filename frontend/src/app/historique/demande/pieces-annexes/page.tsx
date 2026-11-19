import type { Metadata } from 'next';
import { Suspense } from 'react';
import RequestAnnexesPage from '@/components/historique/RequestAnnexesPage';

export const metadata: Metadata = {
  title: 'Pièces annexes · Espace associations | Feytiat',
};

export default function HistoriqueAnnexesPage() {
  return (
    <Suspense>
      <RequestAnnexesPage />
    </Suspense>
  );
}
