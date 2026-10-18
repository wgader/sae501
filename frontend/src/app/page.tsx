'use client';

import { useState } from 'react';
import Link from 'next/link';
import PageTitle from '@/components/ui/PageTitle';
import HomeCard from '@/components/ui/home/HomeCard';

export default function Home() {
  const [isConnected, setIsConnected] = useState(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(window.localStorage.getItem('token'));
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsConnected(false);
    window.dispatchEvent(new Event('auth-change'));
  };

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[var(--White)] font-sans text-[var(--ink)]">
      <div className="mx-auto flex min-h-[104px] w-full max-w-[1440px] items-center justify-end px-[clamp(20px,3.61vw,52px)] py-5">
        {isConnected ? (
          <nav
            aria-label="Compte"
            className="flex w-fit items-center gap-3 text-[11px] uppercase tracking-[0.5px] sm:gap-6 sm:text-sm"
          >
            {/* <Link
              href="/profile"
              className="text-[var(--ink)] underline underline-offset-4 hover:text-[var(--Mosaic-Tile)]"
            >
              Profil
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="text-[var(--Mosaic-Tile)] underline underline-offset-4 hover:text-[var(--moss)]"
            >
              Déconnexion
            </button> */}
          </nav>
        ) : (
          <nav
            aria-label="Authentification"
            className="flex w-fit items-center gap-2 text-[11px] uppercase tracking-[0.5px] sm:gap-6 sm:text-base lg:text-2xl"
          >
            <Link
              href="/login"
              className="flex h-11 items-center justify-center text-[var(--ink)] underline underline-offset-4 hover:text-[var(--moss)] lg:h-11 lg:w-[216px] lg:text-2xl"
            >
              Connexion
            </Link>
            <Link
              href="/signup"
              className="flex h-11 items-center justify-center rounded-[10px] bg-[var(--Mosaic-Tile)] px-3 text-center font-light text-[var(--White)] transition-colors hover:bg-[var(--moss)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--Mosaic-Tile)] sm:h-14 sm:px-5 lg:h-16 lg:w-[244px] lg:px-[10px] lg:text-2xl"
            >
              Inscription
            </Link>
          </nav>
        )}
      </div>

      <header className="relative z-10 mx-auto h-[400px] w-[calc(100%-clamp(32px,6.11vw,88px))] max-w-[1352px] overflow-hidden rounded-[34px] bg-[var(--sage)]">
        <div className="max-w-[790px] px-[clamp(28px,5vw,72px)] pt-[66px]">
          <h4 className="mb-5 text-[13px] font-bold uppercase tracking-[0.22em] text-[var(--ink)]">
            Espace associations
          </h4>

          <h1 className="text-[clamp(3rem,6vw,7rem)] font-black leading-[0.95] tracking-[-0.08em] text-[var(--ink)]">
            <span className="block">Vos projets font</span>
            <span className="block text-[var(--Mosaic-Tile)]">vivre Feytiat.</span>
          </h1>

          <p className="mt-7 max-w-[610px] text-base leading-[1.55] text-[var(--ink)] sm:text-[1.125rem]">
            Retrouvez toutes vos démarches municipales dans un espace simple,
            pensé pour vous faire gagner du temps.
          </p>
        </div>
      </header>

      <section
        aria-labelledby="home-title"
        className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-col items-start px-[clamp(20px,3.61vw,52px)] pb-16 pt-[72px]"
      >
        <PageTitle title="commencer ici" />
        <h1 className="mt-[14px] justify-start text-[var(--ink)] text-5xl font-black">Que souhaiter vous faire ?</h1>

        <nav
          aria-label="Démarches"
          className="mt-[36px] grid w-full gap-4 sm:gap-6 lg:grid-cols-3 lg:gap-[20px]"
        >
          <Link 
          href={isConnected?("/subvention"):("/login")}  
          className="block h-full">
            <HomeCard
              tag="Financer"
              name="Demande de subvention"
              number={1}
              desc="Déposez votre dossier et suivez simplement l’avancement de votre demande."
              variant="pink"
            />
          </Link>

          <Link 
          href={isConnected?("/salle"):("/login")} 
          className="block h-full">
            <HomeCard
              tag="Se réunir"
              name="Réserver une salle"
              number={2}
              desc="Trouvez un espace municipal adapté à vos réunions et à vos événements."
              variant="green"
            />
          </Link>

          <Link 
          href={isConnected?("/materiel"):("/login")} 
          className="block h-full">
            <HomeCard
              tag="S'équiper"
              name="Demande de matériel"
              number={3}
              desc="Réservez le matériel dont votre association a besoin pour ses projets."
              variant="purple"
            />
          </Link>
        </nav>
      </section>

      <button
        type="button"
        aria-pressed={isConnected}
        onClick={() => setIsConnected((value) => !value)}
        className="fixed right-4 bottom-3 z-20 text-[10px] text-[var(--muted)] hover:text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--Mosaic-Tile)]"
      >
        Aperçu : {isConnected ? 'connecté' : 'non connecté'}
      </button>
    </main>
  );
}
