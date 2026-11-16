'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api/client';
import { clearSessions } from '@/lib/session';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
    void fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }).finally(() => {
      clearSessions();
      router.replace('/');
    });
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-white">
      <div className="flex items-center gap-3 text-muted">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm font-semibold">Déconnexion en cours...</span>
      </div>
    </main>
  );
}
