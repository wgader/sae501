import type { Metadata } from 'next';
import AssociationCampaignPage from '@/components/campaign/AssociationCampaignPage';

export const metadata: Metadata = {
  title: 'Campagne des salles · Espace associations | Feytiat',
  description: 'Déposez vos demandes de salle pendant la campagne annuelle et suivez les décisions de la mairie.',
};

export default function CampagnePage() {
  return <AssociationCampaignPage />;
}
