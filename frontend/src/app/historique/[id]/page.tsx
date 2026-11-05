import type { Metadata } from 'next';
import RequestDetailPage from '@/components/historique/RequestDetailPage';

export const metadata: Metadata = {
  title: 'Détail de la démarche · Espace associations | Feytiat',
};

export default function HistoriqueRequestPage() {
  return <RequestDetailPage />;
}
