'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const sections = [
  { label: 'Parc matériel', href: '/admin/materiel' },
  { label: 'Demandes', href: '/admin/materiel/demandes' },
] as const;

export default function EquipmentSectionSwitcher() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Sections de la gestion du matériel"
      className="inline-flex w-fit items-center gap-1 rounded-control bg-primary-soft/70 p-1"
    >
      {sections.map((section) => {
        const isActive =
          section.href === '/admin/materiel'
            ? pathname === section.href
            : pathname.startsWith(section.href);

        return (
          <Link
            key={section.href}
            href={section.href}
            aria-current={isActive ? 'page' : undefined}
            className={`rounded-soft px-4 py-2 text-sm font-bold transition-all ${
              isActive
                ? 'bg-white text-primary shadow-xs'
                : 'text-muted hover:bg-white/60 hover:text-primary'
            }`}
          >
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
