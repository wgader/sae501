'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/api/auth';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    void signOut().finally(() => router.replace('/'));
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
