'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AdminSectionTabs, { adminTabVariants } from '@/components/admin/AdminSectionTabs';

const SECTIONS = [
  { label: 'Parc matériel', href: '/admin/materiel' },
  { label: 'Demandes', href: '/admin/materiel/demandes' },
] as const;

export default function EquipmentSectionTabs() {
  const pathname = usePathname();

  return (
    <AdminSectionTabs label="Sections de la gestion du matériel">
      {SECTIONS.map((section) => {
        const active = section.href === '/admin/materiel' ? pathname === section.href : pathname.startsWith(section.href);
        return (
          <Link key={section.href} href={section.href} aria-current={active ? 'page' : undefined} className={adminTabVariants({ active })}>
            {section.label}
          </Link>
        );
      })}
    </AdminSectionTabs>
  );
}
