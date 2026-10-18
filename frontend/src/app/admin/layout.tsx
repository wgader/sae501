'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import SearchBar from '@/components/ui/SearchBar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const currentPage = usePathname();
  const isLoginPage = currentPage === '/admin';
  const showSearch = currentPage.startsWith('/admin/gestionnaire-inscription');

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <Header>
        {showSearch && <SearchBar />}
      </Header>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}