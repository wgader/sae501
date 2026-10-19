import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ReactNode } from "react";

const navItemVariants = cva(
  "group flex min-h-[44px] w-full items-center justify-center gap-3.5 rounded-[10px] px-0 text-sm font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--Mosaic-Tile)] md:justify-start md:px-3.5",
  {
    variants: {
      selected: {
        true: "bg-[var(--Mosaic-Tile)] text-white shadow-xs font-bold [&_svg]:text-white",
        false: "text-[var(--ink)] hover:bg-[var(--sage)]/40 hover:text-[var(--Mosaic-Tile)] [&_svg]:text-[var(--Mosaic-Tile)]",
      },
    },
    defaultVariants: {
      selected: false,
    },
  },
);

interface NavItemProps {
  root: string;
  name: string;
  icon: ReactNode;
  isSelected?: boolean;
  className?: string;
}

export default function NavItem({
  className = "",
  icon,
  isSelected = false,
  root,
  name,
}: NavItemProps) {
  const href = root ? `/${root}` : "/";

  return (
    <Link
      aria-current={isSelected ? "page" : undefined}
      aria-label={name}
      className={cn(navItemVariants({ selected: isSelected }), className)}
      href={href}
    >
      {icon}
      <span className="hidden md:inline">{name}</span>
    </Link>
  );
}
