'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  IconAccueil,
  IconHistorique,
  IconInscription,
  IconMateriel,
  IconModule,
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
  { label: 'Module', href: '/admin/module', icon: IconModule },
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

  return (
    <aside className="flex h-full w-full flex-col justify-between overflow-y-auto bg-[var(--Mosaic-Tile)] p-5 text-[var(--White)] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href
              || (href !== '/admin/dashboard' && pathname.startsWith(href));

            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                aria-current={isActive ? 'page' : undefined}
                className={`flex h-12 items-center gap-3.5 rounded-[12px] px-4 text-[0.875rem] transition-colors ${
                  isActive
                    ? 'bg-[var(--White)] font-bold text-[var(--Mosaic-Tile)] shadow-sm'
                    : 'font-medium text-white/80 hover:bg-white/10 hover:text-[var(--White)]'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{label}</span>
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
    </aside>
  );
}