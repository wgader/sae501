import type { Metadata } from 'next';
import OneOffBookingPage from '@/components/rooms/OneOffBookingPage';

export const metadata: Metadata = {
  title: 'Réservation ponctuelle de salle · Espace associations | Feytiat',
  description: 'Réservez une salle municipale sur un créneau resté libre, en dehors de la campagne annuelle.',
};

export default function SallesPage() {
  return <OneOffBookingPage />;
}
