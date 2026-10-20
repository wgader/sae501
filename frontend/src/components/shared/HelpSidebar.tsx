import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const helpSidebarVariants = cva('flex flex-col gap-4 w-full');

export interface HelpSidebarDataProps {
  items?: string[];
  delayText?: string;
}

export const defaultHelpItems = [
  'Numéro RNA ou SIRET',
  "Statuts de l'association (PDF)",
  'Récépissé de préfecture (PDF)',
  'Liste des membres du bureau (PDF)',
  "Coordonnées du contact de l'association",
];

export interface HelpSidebarProps
  extends HTMLAttributes<HTMLElement>,
    VariantProps<typeof helpSidebarVariants> {}

export default function HelpSidebar({
  items = defaultHelpItems,
  delayText = "Une fois votre dossier complet soumis, la mairie l'examine sous 48h ouvrées. Vous recevrez un email de confirmation.",
  className,
  ...props
}: HelpSidebarDataProps & HelpSidebarProps) {
  return (
    <aside className={cn(helpSidebarVariants(), className)} {...props}>
      <div className="rounded-lg bg-[#f2f7f5] p-5 sm:p-6 text-sm">
        <h3 className="mb-4 font-bold text-[#0b644d] text-xs sm:text-sm">Ce dont vous aurez besoin :</h3>
        <ul className="flex flex-col gap-3 text-[#4f5851] text-xs sm:text-sm">
          {items.map((item) => (
            <li key={item} className="flex items-center gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0b644d] text-white text-[0.63rem]">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-[#f5dfc6] bg-[#fdf8f3] p-5 sm:p-6 text-sm">
        <h3 className="mb-3 flex items-center gap-2 font-bold text-[#d97706] text-xs sm:text-sm">
          ⏱ Délai de validation
        </h3>
        <p className="leading-relaxed text-[#4f5851] text-xs sm:text-sm">
          {delayText}
        </p>
      </div>
    </aside>
  );
}