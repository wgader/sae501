'use client';

import { Lato } from 'next/font/google';
import './globals.css';
import LateralNavBar from '@/components/layout/LateralNavBar';
import AssociationNotificationBell from '@/components/notifications/AssociationNotificationBell';
import { usePathname } from 'next/navigation';
import { useSessionKind } from '@/hooks/useSessionKind';

const lato = Lato({
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  variable: '--font-lato',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const currentPage = usePathname();
  // La barre latérale est celle de l'espace associations ; la mairie a sa navigation sous /admin.
  const isConnected = useSessionKind() === 'association';

  // La barre latérale s'affiche pour les associations connectées (à l'accueil / et sur les modules subventions, salles, materiel, historique, profil).
  // Elle ne doit jamais apparaître sur la connexion, l'inscription, l'activation, le mot de passe oublié ou l'admin.
  const isAuthOrAdminPage =
    currentPage === '/connexion' ||
    currentPage === '/inscription' ||
    currentPage === '/mot-de-passe-oublie' ||
    currentPage === '/reinitialiser-mot-de-passe' ||
    currentPage === '/deconnexion' ||
    currentPage.startsWith('/connexion/') ||
    currentPage.startsWith('/inscription/') ||
    currentPage.startsWith('/activer-compte') ||
    currentPage.startsWith('/admin');

  const shouldShowLateralNav = isConnected && !isAuthOrAdminPage;

  return (
    <html lang="fr" className="scroll-smooth" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${lato.variable} flex min-h-screen flex-col bg-white font-sans text-ink antialiased md:flex-row`}
      >
        {shouldShowLateralNav && <LateralNavBar />}
        {shouldShowLateralNav && <AssociationNotificationBell />}
        <div className="min-w-0 flex-1">{children}</div>
      </body>
    </html>
  );
}
