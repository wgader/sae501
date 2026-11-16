'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import LandingPage from '@/components/landing/LandingPage';
import ConnectedDashboard from '@/components/dashboard/ConnectedDashboard';

function subscribeAuth(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('auth-change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('auth-change', callback);
  };
}

function getAuthSnapshot() {
  return Boolean(localStorage.getItem('token'));
}

// Compte mairie connecté sans session association : son accueil est le tableau de bord admin.
function getAdminSnapshot() {
  return Boolean(localStorage.getItem('admin_token')) && !localStorage.getItem('token');
}

function getServerAuthSnapshot() {
  return false;
}

export default function Home() {
  const router = useRouter();
  const isConnected = useSyncExternalStore(
    subscribeAuth,
    getAuthSnapshot,
    getServerAuthSnapshot,
  );
  const isAdminOnly = useSyncExternalStore(
    subscribeAuth,
    getAdminSnapshot,
    getServerAuthSnapshot,
  );

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
    localStorage.removeItem('token');
    localStorage.removeItem('association_name');
    window.dispatchEvent(new Event('auth-change'));
  };

  if (isConnected) {
    return <ConnectedDashboard />;
  }

  return <LandingPage isConnected={false} onLogout={handleLogout} />;
}
