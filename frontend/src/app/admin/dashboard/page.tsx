'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UserData {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  roles: string[];
  typeCompte: string;
  isVerified: boolean;
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token) {
      router.push('/login');
      return;
    }

    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        router.push('/login');
      }
    }
  }, [router]);

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-gray-500">Chargement...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8f4] font-sans text-[#1e2420]">
      {/* Header */}
      <header className="flex items-center justify-between bg-[#0b644d] px-6 py-4 text-white">
        <div className="flex items-center gap-2 font-bold text-lg">
          <span className="text-green-300">🍃</span>
          <span>Feytiat Associations</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm">
            {user.prenom} {user.nom}
          </span>
          <button
            onClick={handleLogout}
            className="rounded bg-white/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wide hover:bg-white/30 transition"
          >
            Déconnexion
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="mb-2 text-2xl font-black uppercase tracking-tight">
          Tableau de bord
        </h1>
        <p className="mb-8 text-sm text-[#6d746e]">
          Bienvenue, {user.prenom} {user.nom}
        </p>

        {/* Info card */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-[#0b644d]">
            Informations du compte
          </h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-[#6d746e]">Email</dt>
              <dd className="mt-1 text-sm">{user.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-[#6d746e]">Type de compte</dt>
              <dd className="mt-1 text-sm capitalize">{user.typeCompte}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-[#6d746e]">Rôles</dt>
              <dd className="mt-1 flex flex-wrap gap-2">
                {user.roles.map((role) => (
                  <span
                    key={role}
                    className="rounded-full bg-[#0b644d]/10 px-2.5 py-0.5 text-xs font-medium text-[#0b644d]"
                  >
                    {role}
                  </span>
                ))}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-[#6d746e]">Vérifié</dt>
              <dd className="mt-1 text-sm">
                {user.isVerified ? (
                  <span className="text-green-600 font-bold">✓ Oui</span>
                ) : (
                  <span className="text-red-600 font-bold">✗ Non</span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </main>
  );
}

