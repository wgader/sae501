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
} from '@/components/ui/NavigationBar/NavigationIcon';

interface AdminSidebarProps {
  onNavigate?: () => void;
}

const navItems = [
  { label: 'Accueil', href: '/admin/dashboard', icon: IconAccueil },
  { label: 'Inscription', href: '/admin/inscription', icon: IconInscription },
  { label: 'Association', href: '/admin/association', icon: IconAssociation },
  { label: 'Salle', href: '/admin/salle', icon: IconSalle },
  { label: 'Matériel', href: '/admin/materiel', icon: IconMateriel },
  { label: 'Subvention', href: '/admin/subvention', icon: IconSubvention },
  { label: 'Agent', href: '/admin/agent', icon: IconAgent },
  { label: 'Historique', href: '/admin/historique', icon: IconHistorique },
];

export default function AdminSidebar({ onNavigate }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    router.replace('/admin');
  };

  const navItems = [
    {
      label: 'Accueil',
      href: '/admin/dashboard',
      icon: (
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <g clipPath="url(#admin_home_clip)">
            <path d="M7 0H4C1.79086 0 0 1.79086 0 4V7C0 9.20914 1.79086 11 4 11H7C9.20914 11 11 9.20914 11 7V4C11 1.79086 9.20914 0 7 0Z" />
            <path d="M19.9998 0H16.9998C14.7907 0 12.9999 1.79086 12.9999 4V7C12.9999 9.20915 14.7907 11 16.9998 11H19.9998C22.209 11 23.9998 9.20915 23.9998 7V4C23.9998 1.79086 22.209 0 19.9998 0Z" />
            <path d="M6.99999 13H3.99999C1.79085 13 0 14.7909 0 17V20C0 22.2092 1.79085 24 3.99999 24H6.99999C9.20913 24 11 22.2092 11 20V17C11 14.7909 9.20913 13 6.99999 13Z" />
            <path d="M19.9998 13H16.9998C14.7907 13 12.9999 14.7909 12.9999 17V20C12.9999 22.2092 14.7907 24 16.9998 24H19.9998C22.209 24 23.9998 22.2092 23.9998 20V17C23.9998 14.7909 22.209 13 19.9998 13Z" />
          </g>
          <defs>
            <clipPath id="admin_home_clip">
              <rect width="24" height="24" fill="white" />
            </clipPath>
          </defs>
        </svg>
      ),
    },
    {
      label: 'Inscription',
      href: '/admin/inscriptions',
      icon: (
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <line x1="20" y1="8" x2="20" y2="14" />
          <line x1="23" y1="11" x2="17" y2="11" />
        </svg>
      ),
    },
    {
      label: 'Modules',
      href: '/admin/modules',
      icon: (
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
        </svg>
      ),
    },
    {
      label: 'Événements',
      href: '/admin/evenements',
      icon: (
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
          <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
        </svg>
      ),
    },
    {
      label: 'Agents',
      href: '/admin/agents',
      icon: (
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
  ];

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
            {navItems.map(({ href, label, icon: Icon }) => {
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
