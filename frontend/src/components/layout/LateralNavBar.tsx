'use client';

import Image from "next/image";
import Link from "next/link";
import { ReactNode, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import NavItem from "../ui/NavigationBar/NavItem";
import {
  IconAccueil,
  IconEvenement,
  IconHistorique,
  IconMateriel,
  IconProfil,
  IconSalle,
  IconSubvention,
} from "../ui/NavigationBar/NavigationIcon";
import { getStoredAssociationName, getAssociationInitials } from "@/lib/authUtils";

interface NavItemData {
  root: string;
  name: string;
  icon: ReactNode;
}

const moduleItems: NavItemData[] = [
  { root: "", name: "Accueil", icon: <IconAccueil className="h-6 w-6 shrink-0" /> },
  { root: "subventions", name: "Subventions", icon: <IconSalle className="h-6 w-6 shrink-0" /> },
  { root: "salles", name: "Salles", icon: <IconSubvention className="h-6 w-6 shrink-0" /> },
  { root: "materiel", name: "Matériel", icon: <IconMateriel className="h-6 w-6 shrink-0" /> },
  { root: "evenements", name: "Événements", icon: <IconEvenement className="h-6 w-6 shrink-0" /> },
  { root: "historique", name: "Historique", icon: <IconHistorique className="h-6 w-6 shrink-0" /> },
  { root: "profil", name: "Profil", icon: <IconProfil className="h-6 w-6 shrink-0" /> },
];

function subscribeAuth(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('auth-change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('auth-change', callback);
  };
}

function getServerNameSnapshot(): string {
  return 'Feytiat Loisirs';
}

interface LateralNavBarProps {
  className?: string;
}

export default function LateralNavBar({ className = "" }: LateralNavBarProps) {
  const currentPage = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const rawName = useSyncExternalStore(
    subscribeAuth,
    getStoredAssociationName,
    getServerNameSnapshot
  );

  const associationName = rawName.replace(/^Association\s+/i, '').trim() || rawName;
  const initials = getAssociationInitials(associationName);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('association_name');
    window.dispatchEvent(new Event('auth-change'));
    router.push('/');
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-[var(--line)] bg-[var(--White)] px-4 md:hidden">
        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-expanded={mobileMenuOpen}
          aria-label="Ouvrir le menu de navigation"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--line)] text-[var(--ink)] transition-colors hover:bg-[var(--paper)]"
        >
          {mobileMenuOpen ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        <Link href="/" aria-label="Accueil Feytiat" className="flex items-center">
          <Image
            src="/assets/logo-feytiat.svg"
            alt="Feytiat"
            width={120}
            height={25}
            priority
            className="h-6 w-auto"
          />
        </Link>

        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--Lime-Cream)] text-xs font-black text-[var(--ink)]">
          {initials}
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />          <aside className="relative flex h-full w-[17.5rem] max-w-[85vw] flex-col justify-between border-r border-[var(--line)] bg-[var(--White)] p-4 shadow-2xl">
            <div>
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-4 pt-2">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Accueil Feytiat"
                >
                  <Image
                    src="/assets/logo-feytiat.svg"
                    alt="Feytiat"
                    width={130}
                    height={27}
                    priority
                    className="h-7 w-auto"
                  />
                </Link>

                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Fermer le menu"
                  className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--paper)]"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <nav aria-label="Menu mobile dashboard" className="mt-4 flex flex-col gap-1.5">
                {moduleItems.map((item) => {
                  const href = item.root ? `/${item.root}` : "/";
                  const isSelected =
                    href === "/"
                      ? currentPage === "/"
                      : currentPage === href || currentPage.startsWith(`${href}/`);

                  return (
                    <div key={item.root || "home"} onClick={() => setMobileMenuOpen(false)}>
                      <NavItem
                        root={item.root}
                        name={item.name}
                        icon={item.icon}
                        isSelected={isSelected}
                      />
                    </div>
                  );
                })}
              </nav>
            </div>

            <div className="border-t border-[var(--line)] pt-4">
              <div className="flex items-center justify-between rounded-[0.75rem] border border-[var(--line)] bg-[var(--White)] p-2.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--Lime-Cream)] text-[0.69rem] font-black text-[var(--ink)]">
                    {initials}
                  </span>
                  <span className="truncate text-xs font-semibold text-[var(--ink)]">
                    {associationName}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  title="Se déconnecter"
                  aria-label="Se déconnecter"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--Misty-Rose)] hover:text-[var(--Flush-Mahogany)]"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                  </svg>
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      <nav
        aria-label="Navigation principale"
        className={`hidden md:sticky md:top-0 md:flex md:h-screen md:w-[15rem] lg:w-[16.25rem] shrink-0 flex-col justify-between border-r border-[var(--line)] bg-[var(--White)] ${className}`}
      >
        <div>
          <Link
            href="/"
            aria-label="Accueil Feytiat"
            className="block px-6 pb-8 pt-8"
          >
            <Image
              src="/assets/logo-feytiat.svg"
              alt="Feytiat"
              width={364}
              height={75}
              priority
              className="h-auto w-full max-w-[10.63rem]"
            />
          </Link>

          <section className="flex flex-col gap-1.5 px-3 md:px-4">
            {moduleItems.map((item) => {
              const href = item.root ? `/${item.root}` : "/";
              const isSelected =
                href === "/"
                  ? currentPage === "/"
                  : currentPage === href || currentPage.startsWith(`${href}/`);

              return (
                <NavItem
                  key={item.root || "home"}
                  root={item.root}
                  name={item.name}
                  icon={item.icon}
                  isSelected={isSelected}
                />
              );
            })}
          </section>
        </div>

        <div className="border-t border-[var(--line)] p-3 md:p-4">
          <div className="group relative flex items-center justify-between rounded-[0.88rem] border border-[var(--line)] bg-[var(--White)] p-2 shadow-xs transition-colors hover:border-[var(--muted)]/40">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--Lime-Cream)] text-[0.69rem] font-black text-[var(--ink)]">
                {initials}
              </span>
              <span className="truncate text-xs font-semibold text-[var(--ink)]">
                {associationName}
              </span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Se déconnecter"
              aria-label="Se déconnecter"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--Misty-Rose)] hover:text-[var(--Flush-Mahogany)]"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
              </svg>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}