import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ReactNode } from "react";

const navItemVariants = cva(
  "flex min-h-16 w-full items-center justify-center gap-4 rounded-[10px] px-0 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-Primary md:justify-start md:px-6 md:text-base",
  {
    variants: {
      selected: {
        true: "bg-Primary text-white",
        false: "text-Primary hover:bg-[#E8F4F2]",
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
