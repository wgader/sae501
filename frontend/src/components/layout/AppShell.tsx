'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import LateralNavBar from '@/components/layout/LateralNavBar';
import AssociationNotificationBell from '@/components/notifications/AssociationNotificationBell';
import { useSessionKind } from '@/hooks/useSessionKind';

/** Pages sans la navigation de l'espace associations (connexion, inscription, admin…). */
function isAuthOrAdminPage(path: string): boolean {
  return (
    ['/connexion', '/inscription', '/mot-de-passe-oublie', '/reinitialiser-mot-de-passe', '/deconnexion'].includes(path) ||
    ['/connexion/', '/inscription/', '/activer-compte', '/admin'].some((prefix) => path.startsWith(prefix))
  );
}

/** Habillage de l'espace associations : barre latérale et notifications pour une association connectée. */
export default function AppShell({ children }: { children: ReactNode }) {
  const currentPage = usePathname();
  // La barre latérale est celle de l'espace associations ; la mairie a sa navigation sous /admin.
  const showNavigation = useSessionKind() === 'association' && !isAuthOrAdminPage(currentPage);

  return (
    <>
      {showNavigation && <LateralNavBar />}
      {showNavigation && <AssociationNotificationBell />}
      <div className="min-w-0 flex-1">{children}</div>
    </>
  );
}
