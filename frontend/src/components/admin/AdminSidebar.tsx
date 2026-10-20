'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconAccueil,
  IconHistorique,
  IconMateriel,
  IconSalle,
  IconSubvention,
} from '@/components/ui/NavigationBar/NavigationIcon';

const navigation = [
  { href: '/admin/dashboard', label: 'Tableau de bord', icon: IconAccueil },
  { href: '/admin/dashboard#associations', label: 'Associations', icon: IconHistorique },
  { href: '/admin/salles', label: 'Salles', icon: IconSalle },
  { href: '/admin/dashboard#materiel', label: 'Matériel', icon: IconMateriel },
  { href: '/admin/dashboard#subventions', label: 'Subventions', icon: IconSubvention },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-64 shrink-0 border-r border-[#D9E8E4] bg-white lg:flex lg:flex-col">
      <div className="border-b border-[#D9E8E4] px-7 py-7">
        <Link href="/admin/dashboard" aria-label="Retour au tableau de bord">
          <Image
            src="/assets/logo-feytiat.svg"
            alt="Feytiat"
            width={364}
            height={75}
            priority
            className="h-auto w-36"
          />
        </Link>
        <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#146E67]">Espace mairie</p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-6" aria-label="Navigation administration">
        {navigation.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/admin/dashboard'
            ? pathname === href
            : href === '/admin/salles'
              ? pathname.startsWith('/admin/salles')
              : false;

          return (
            <Link
              key={label}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-[#146E67] text-white shadow-sm'
                  : 'text-[#4D625B] hover:bg-[#E8F4F2] hover:text-[#146E67]'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#D9E8E4] p-4">
        <div className="flex items-center gap-3 rounded-lg border border-[#B9D8D1] px-3 py-3">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[#D8EC95] text-xs font-black text-[#146E67]">M</span>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-[#1E2420]">Mairie de Feytiat</p>
            <p className="text-[11px] text-[#6D746E]">Administrateur</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
