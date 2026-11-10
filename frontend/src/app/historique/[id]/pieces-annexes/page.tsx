import type { Metadata } from 'next';
import RequestAnnexesPage from '@/components/historique/RequestAnnexesPage';

export const metadata: Metadata = {
  title: 'Pièces annexes · Espace associations | Feytiat',
};

export default function HistoriqueAnnexesPage() {
  return <RequestAnnexesPage />;
}
