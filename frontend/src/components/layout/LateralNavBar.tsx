'use client';

import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import NavItem from "../ui/NavigationBar/NavItem";
import {
  IconAccueil,
  IconHistorique,
  IconMateriel,
  IconProfil,
  IconSalle,
  IconSubvention,
} from "../ui/NavigationBar/NavigationIcon";

interface NavItemData {
  root: string;
  name: string;
  icon: ReactNode;
}

const moduleItems: NavItemData[] = [
  { root: "", name: "Accueil", icon: <IconAccueil className="h-6 w-6 shrink-0" /> },
  { root: "subventions", name: "Subventions", icon: <IconSalle className="h-6 w-6 shrink-0" /> },
  { root: "salles", name: "Salles", icon: <IconSubvention className="h-6 w-6 shrink-0" /> },
  { root: "materiel", name: "Matériel", icon: <IconProfil className="h-6 w-6 shrink-0" /> },
   { root: "profil", name: "Profil", icon: <IconMateriel className="h-6 w-6 shrink-0" /> },
  { root: "historique", name: "Historique", icon: <IconHistorique className="h-6 w-6 shrink-0" /> },

];

const moduleItemsAdmin: NavItemData[] = [
  { root: "admin", name: "Accueil", icon: <IconAccueil className="h-6 w-6 shrink-0" /> },
  { root: "admin/inscription", name: "Inscriptions", icon: <IconSalle className="h-6 w-6 shrink-0" /> },
  { root: "admin/module", name: "Gestion des modules", icon: <IconSubvention className="h-6 w-6 shrink-0" /> },
  { root: "admin/agents", name: "Gestion des agents", icon: <IconProfil className="h-6 w-6 shrink-0" /> },
];

interface LateralNavBarProps {
  className?: string;
}

export default function LateralNavBar({ className = "" }: LateralNavBarProps) {
  const currentPage = usePathname();
  const isAdmin =
  currentPage === "/admin" || currentPage.startsWith("/admin/");
    // currentPage === "/profil" || currentPage.startsWith("/profil/");
  const navItems =isAdmin? (moduleItemsAdmin):(moduleItems);

  return (
    <nav
      aria-label="Navigation principale"
      className={`sticky top-0 flex h-screen w-[76px] shrink-0 flex-col border-r border-[#E7ECEB] bg-white md:w-[280px] ${className}`}
    >
      <Link
        href="/"
        aria-label="Accueil Feytiat"
        className="hidden px-6 pb-8 pt-8 md:block"
      >
        <Image
          src="/assets/logo-feytiat.svg"
          alt="Feytiat"
          width={364}
          height={75}
          priority
          className="h-auto w-full"
        />
      </Link>

      <section className="flex flex-col gap-2">
        {navItems.map((item) => {
          const href = item.root ? `/${item.root}` : "/";
          const isSelected =
            currentPage === href ||
            (href !== "/" && currentPage.startsWith(`${href}/`));

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
    </nav>
  );
}