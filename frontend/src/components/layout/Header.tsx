// components/layout/Header.tsx
import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-3 sm:px-6 text-sm text-white">
      {/* <div className="flex items-center gap-2 font-bold text-base sm:text-lg">
       
        <Image
                   src="/assets/logo-feytiat.svg"
                   alt="Logo Feytiat"
                   width={364}
                   height={75}
                   priority
                   className="h-auto w-[min(364px,36vw)] sm:w-[min(364px,38vw)] lg:w-[364px]"
                 /> </div> */}
      <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6">
        <Link href="/login" className="text-xs sm:text-sm hover:underline text-black">
          <span className="hidden sm:inline">Déjà inscrit ? </span>Se connecter →
        </Link>
      </div>
    </header>
  );
}
