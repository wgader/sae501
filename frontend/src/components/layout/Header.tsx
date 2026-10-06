// components/layout/Header.tsx
import Link from 'next/link';

export default function Header() {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0b644d] px-4 py-3 sm:px-6 text-sm text-white">
      <div className="flex items-center gap-2 font-bold text-base sm:text-lg">
        <span className="text-green-300">🍃</span>
        <span>Feytiat Associations</span>
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6">
        <Link href="/login" className="text-xs sm:text-sm hover:underline">
          <span className="hidden sm:inline">Déjà inscrit ? </span>Se connecter →
        </Link>
      </div>
    </header>
  );
}