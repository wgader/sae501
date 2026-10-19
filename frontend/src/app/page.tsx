'use client';

import { useSyncExternalStore, useEffect } from 'react';
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

function getAuthSnapshot(): boolean {
  return Boolean(localStorage.getItem('token'));
}

function getServerAuthSnapshot(): boolean {
  return false;
}

export default function Home() {
  const isConnected = useSyncExternalStore(
    subscribeAuth,
    getAuthSnapshot,
    getServerAuthSnapshot
  );

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
