'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  IconAccueil,
  IconHistorique,
  IconInscription,
  IconMateriel,
  IconSalle,
  IconSubvention,
  IconAssociation,
  IconAgent,
  IconEvenement,
} from '@/components/ui/NavigationBar/NavigationIcon';

interface AdminSidebarProps {
  onNavigate?: () => void;
}

const navItems = [
  { label: 'Accueil', href: '/admin/dashboard', icon: IconAccueil },
  { label: 'Inscription', href: '/admin/inscription', roles: ['ROLE_ADMIN'], icon: IconInscription },
  { label: 'Association', href: '/admin/association', roles: ['ROLE_ADMIN'], icon: IconAssociation },
  { label: 'Salle', href: '/admin/salle', roles: ['ROLE_ADMIN', 'ROLE_GESTION_SALLE'], icon: IconSalle },
  { label: 'Matériel', href: '/admin/materiel', roles: ['ROLE_ADMIN', 'ROLE_GESTION_MATERIEL'], icon: IconMateriel },
  { label: 'Subvention', href: '/admin/subvention', roles: ['ROLE_ADMIN', 'ROLE_GESTION_SUBVENTION'], icon: IconSubvention },
  { label: 'Événements', href: '/admin/evenements', allRoles: ['ROLE_MAIRIE', 'ROLE_GESTION_EVENT'], icon: IconEvenement },
  { label: 'Agents', href: '/admin/agent', roles: ['ROLE_ADMIN'], icon: IconAgent },
  { label: 'Historique', href: '/admin/historique', roles: ['ROLE_ADMIN'], icon: IconHistorique },
];

export default function AdminSidebar({ onNavigate }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const roles = getAdminRoles();
  const isAdmin = roles.includes('ROLE_ADMIN');

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    router.replace('/admin');
  };

  return (
    <div className="flex h-full w-full flex-col justify-between overflow-y-auto bg-primary p-5 text-white [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div>
        <Link
          href="/admin/dashboard"
          onClick={onNavigate}
          aria-label="Tableau de bord administration"
          className="mb-8 block px-2 pt-2 transition-opacity hover:opacity-90"
        >
          <Image
            src="/assets/logo-feytiat-white.svg"
            alt="Ville de Feytiat"
            width={160}
            height={34}
            priority
            className="h-8 w-auto object-contain"
          />
        </Link>

        <nav aria-label="Menu principal administration">
          <ul className="flex flex-col gap-2">
            {navItems.filter((item) => (
              isAdmin
              || (!item.allRoles && (!item.roles || item.roles.some((role) => roles.includes(role))))
              || (item.allRoles && item.allRoles.every((role) => roles.includes(role)))
            )).map(({ href, label, icon: Icon }) => {
              const isActive =
                pathname === href ||
                (href !== '/admin/dashboard' && pathname.startsWith(href));

              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex h-12 items-center gap-3.5 rounded-control px-4 text-body-sm transition-colors ${
                      isActive
                        ? 'bg-white font-bold text-primary shadow-xs'
                        : 'font-medium text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div className="pt-6">
        <button
          type="button"
          onClick={handleLogout}
          className="flex h-12 w-full items-center gap-3 rounded-control bg-white px-4 text-body-sm font-bold text-primary shadow-xs transition-colors hover:bg-accent cursor-pointer"
        >
          <svg
            className="h-5 w-5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
            />
          </svg>
          <span>Se déconnecter</span>
        </button>
      </div>
    </div>
  );
}

function getAdminRoles(): string[] {
  if (typeof window === 'undefined') return [];

  const token = localStorage.getItem('admin_token');
  if (!token) return [];

  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return Array.isArray(payload.roles)
      ? payload.roles.filter((role: unknown): role is string => typeof role === 'string')
      : [];
  } catch {
    return [];
  }
}