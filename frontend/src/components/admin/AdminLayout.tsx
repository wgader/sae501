'use client';

import { ReactNode, useEffect, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

interface AdminLayoutProps {
  children: ReactNode;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

const emptySubscribe = () => () => {};

export default function AdminLayout({
  children,
  searchTerm,
  onSearchChange,
}: AdminLayoutProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const token = useSyncExternalStore(
    emptySubscribe,
    () => localStorage.getItem('admin_token'),
    () => undefined
  );

  useEffect(() => {
    if (token === null) {
      router.replace('/admin');
    }
  }, [token, router]);

  if (token === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-primary text-white">
        <p className="text-sm font-semibold tracking-wider uppercase">Chargement de l&apos;administration...</p>
      </main>
    );
  }

  if (!token) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full bg-primary font-sans text-ink antialiased">
      <aside className="hidden w-sidebar shrink-0 lg:block">
        <div className="sticky top-0 h-screen">
          <AdminSidebar />
        </div>
      </aside>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative flex h-full w-68 max-w-[85vw] flex-col shadow-2xl">
            <AdminSidebar onNavigate={() => setMobileMenuOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          isMobileMenuOpen={mobileMenuOpen}
          onToggleMobileMenu={() => setMobileMenuOpen((open) => !open)}
        />

        <main className="flex-1 rounded-tl-4xl bg-white p-6 shadow-sm sm:p-10 lg:p-12">
          {children}
        </main>
      </div>
    </div>
  );
}
