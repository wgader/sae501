import type { Metadata } from 'next';
import HistoriqueDashboard from '@/components/historique/HistoriqueDashboard';

export const metadata: Metadata = {
  title: 'Mes démarches & Historique · Espace associations | Feytiat',
  description:
    'Consultez et suivez en temps réel l’ensemble des demandes administratives, réservations de matériel et de salles de votre association auprès de la mairie de Feytiat.',
};

export default function HistoriquePage() {
  return <HistoriqueDashboard />;
}
