'use client';

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

interface AdminSearchContextType {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const AdminSearchContext = createContext<AdminSearchContextType>({
  searchTerm: '',
  setSearchTerm: () => {},
});

export const useAdminSearch = () => useContext(AdminSearchContext);

const emptySubscribe = () => () => {};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const isAuthPage = pathname === '/admin' || pathname === '/admin/signup';

  const token = useSyncExternalStore(
    emptySubscribe,
    () => (typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null),
    () => undefined
  );

  useEffect(() => {
    if (!isAuthPage && token === null) {
      router.replace('/admin');
    }
  }, [token, isAuthPage, router]);

  if (isAuthPage) {
    return <>{children}</>;
  }

  if (token === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--Mosaic-Tile)] text-[var(--White)]">
        <p className="text-sm font-semibold tracking-wider uppercase">Chargement de l&apos;administration...</p>
      </main>
    );
  }

  if (!token) {
    return null;
  }

  return (
    <AdminSearchContext.Provider value={{ searchTerm, setSearchTerm }}>
      <div className="flex min-h-screen w-full bg-[var(--Mosaic-Tile)] font-sans text-[var(--ink)] antialiased">
        <aside className="hidden w-[250px] shrink-0 lg:block">
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
            <aside className="relative flex h-full w-[270px] max-w-[85vw] flex-col shadow-2xl">
              <AdminSidebar onNavigate={() => setMobileMenuOpen(false)} />
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <AdminHeader
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            isMobileMenuOpen={mobileMenuOpen}
            onToggleMobileMenu={() => setMobileMenuOpen((open) => !open)}
          />

          <main className="flex-1 rounded-tl-[32px] bg-[var(--White)] p-6 sm:p-10 lg:p-12 shadow-sm pb-28">
            {children}
          </main>
        </div>
      </div>
    </AdminSearchContext.Provider>
  );
}