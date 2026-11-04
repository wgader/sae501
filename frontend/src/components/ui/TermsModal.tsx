'use client';

import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const termsModalOverlayVariants = cva(
  'fixed inset-0 z-10 flex items-center justify-center bg-ink/50 px-5 py-8',
);

export const termsModalContentVariants = cva(
  'max-h-full w-full max-w-2xl overflow-y-auto bg-paper p-7 text-ink shadow-2xl sm:p-10',
);

export interface TermsSection {
  title: string;
  text: string;
}

export const defaultTermsSections: TermsSection[] = [
  {
    title: '1. Objet',
    text: "Les présentes conditions définissent les règles d'accès et d'utilisation du service. La création d'un compte signifie que vous acceptez ces conditions dans leur intégralité.",
  },
  {
    title: '2. Création du compte',
    text: "Vous devez fournir des informations exactes et à jour. Votre compte est personnel : vous êtes responsable de la confidentialité de vos identifiants et de toute activité réalisée depuis celui-ci.",
  },
  {
    title: '3. Données personnelles',
    text: "Les coordonnées du contact de l'association sont utilisées pour instruire le dossier, sécuriser l'accès au service et transmettre les notifications liées à la demande. Elles ne sont pas vendues.",
  },
  {
    title: '4. Utilisation du service',
    text: "Vous vous engagez à utiliser le service de manière légale, respectueuse et conforme à sa finalité. Toute utilisation frauduleuse ou tentative d'accès non autorisé peut entraîner la suspension du compte.",
  },
  {
    title: '5. Contact',
    text: "Pour toute question concernant ces conditions ou l'exercice de vos droits, adressez-vous à la mairie de Feytiat via le canal de contact indiqué sur le portail.",
  },
];

export interface TermsModalDataProps {
  sections?: TermsSection[];
  lastUpdated?: string;
  title?: string;
  subtitle?: string;
}

export interface TermsModalProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof termsModalOverlayVariants> {
  onClose: () => void;
  contentClassName?: string;
}

export default function TermsModal({
  onClose,
  sections = defaultTermsSections,
  lastUpdated = '15 septembre 2026',
  title = "Conditions générales d'utilisation",
  subtitle = 'Informations légales',
  className,
  contentClassName,
  ...props
}: TermsModalDataProps & TermsModalProps) {
  return (
    <div
      className={cn(termsModalOverlayVariants(), className)}
      role="presentation"
      onClick={onClose}
      {...props}
    >
      <section
        className={cn(termsModalContentVariants(), contentClassName)}
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-7 flex items-start justify-between gap-6 border-b border-line pb-5">
          <div>
            <p className="mb-2 text-caption font-bold uppercase tracking-kicker text-moss">
              {subtitle}
            </p>
            <h2 id="terms-title" className="text-2xl font-black uppercase tracking-heading sm:text-3xl">
              {title}
            </h2>
          </div>
          <button
            className="shrink-0 text-2xl leading-none text-muted transition hover:text-ink cursor-pointer"
            type="button"
            aria-label="Fermer les conditions générales d'utilisation"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="space-y-6 text-sm leading-6 text-moss">
          <p>Dernière mise à jour : {lastUpdated}</p>
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="mb-1 font-bold text-ink">{section.title}</h3>
              <p>{section.text}</p>
            </div>
          ))}
        </div>

        <button
          className="mt-8 w-full bg-ink px-5 py-3.5 text-xs font-bold uppercase tracking-label text-white transition hover:bg-moss cursor-pointer"
          type="button"
          onClick={onClose}
        >
          Fermer
        </button>
      </section>
    </div>
  );
}
