'use client';

import { useEffect, useState } from 'react';
import { Lato } from 'next/font/google';
import './globals.css';
import LateralNavBar from '@/components/layout/LateralNavBar';
import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';

const lato = Lato({
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  variable: '--font-lato',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const currentPage = usePathname();
  const [isConnected, setIsConnected] = useState(false);
  const shouldShowOnCurrentPage =
    currentPage !== '/login' &&
    currentPage !== '/signup' &&
    !currentPage.startsWith('/login/') &&
    !currentPage.startsWith('/signup/');

  useEffect(() => {
    const updateConnectionState = () => {
      setIsConnected(Boolean(localStorage.getItem('token')));
    };

    updateConnectionState();
    window.addEventListener('auth-change', updateConnectionState);
    window.addEventListener('storage', updateConnectionState);

    return () => {
      window.removeEventListener('auth-change', updateConnectionState);
      window.removeEventListener('storage', updateConnectionState);
    };
  }, [currentPage]);

  return (
    <html lang="fr">
      <body className={`${lato.variable} flex min-h-screen bg-white font-sans text-black antialiased`}>
        {isConnected && shouldShowOnCurrentPage && <LateralNavBar />}
        <div className="min-w-0 flex-1">{children}</div>
      </body>
    </html>
  );
}
