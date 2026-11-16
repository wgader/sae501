'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LandingPage from '@/components/landing/LandingPage';
import ConnectedDashboard from '@/components/dashboard/ConnectedDashboard';
import { useSessionKind } from '@/hooks/useSessionKind';
import { signOut } from '@/lib/api/auth';

export default function Home() {
  const router = useRouter();
  const sessionKind = useSessionKind();
  const isConnected = sessionKind === 'association';
  // Compte mairie connecté : son accueil est le tableau de bord admin.
  const isAdminOnly = sessionKind === 'admin';

  useEffect(() => {
    if (isAdminOnly) {
      router.replace('/admin/dashboard');
    }
  }, [isAdminOnly, router]);

  useEffect(() => {
    document.title = isConnected
      ? 'Accueil · Espace associations | Feytiat'
      : 'Espace Associations | Ville de Feytiat - Vos démarches en un seul endroit';
  }, [isConnected]);

  const handleLogout = () => {
    void signOut();
  };

  if (isConnected) {
    return <ConnectedDashboard />;
  }

  return <LandingPage isConnected={false} onLogout={handleLogout} />;
}
