'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface AdminSidebarProps {
  onNavigate?: () => void;
}

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
      label: 'Matériel',
      href: '/admin/materiel',
      icon: (
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
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
    <aside className="flex h-full w-full flex-col justify-between bg-[var(--Mosaic-Tile)] p-5 text-[var(--White)]">
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

        <nav aria-label="Menu principal administration" className="flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={isActive ? 'page' : undefined}
                className={`flex h-12 items-center gap-3.5 rounded-[12px] px-4 text-[0.875rem] transition-colors ${
                  isActive
                    ? 'bg-[var(--White)] font-bold text-[var(--Mosaic-Tile)] shadow-sm'
                    : 'font-medium text-white/80 hover:bg-white/10 hover:text-[var(--White)]'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-6">
        <button
          type="button"
          onClick={handleLogout}
          className="flex h-12 w-full items-center gap-3 rounded-[12px] bg-[var(--White)] px-4 text-[0.875rem] font-bold text-[var(--Mosaic-Tile)] shadow-sm transition-opacity hover:opacity-95"
        >
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
          </svg>
          <span>Se déconnecter</span>
        </button>
      </div>
    </aside>
  );
}
