'use client';

import { ReactNode } from 'react';

interface AdminLayoutProps {
  children: ReactNode;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  pagination?: ReactNode;
}

/**
 * Le layout est désormais géré nativement par Next.js dans `src/app/admin/layout.tsx`.
 * Ce composant agit comme un wrapper transparent pour assurer la compatibilité ascendante.
 */
export default function AdminLayout({
  children,
  pagination,
}: AdminLayoutProps) {
  return (
    <>
      {children}
      {pagination}
    </>
  );
}
