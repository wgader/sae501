export type IconProps = {
  className?: string;
  'aria-hidden'?: boolean | 'true' | 'false';
};

// ==========================================
// 1. Navigation & Administration Icons
// ==========================================

export function IconAccueil({ className = 'h-5 w-5', 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden={ariaHidden} fill="currentColor">
      <g clipPath="url(#clip0_home_lib)">
        <path d="M7 0H4C1.79086 0 0 1.79086 0 4V7C0 9.20914 1.79086 11 4 11H7C9.20914 11 11 9.20914 11 7V4C11 1.79086 9.20914 0 7 0Z" fill="currentColor" />
        <path d="M19.9998 0H16.9998C14.7907 0 12.9999 1.79086 12.9999 4V7C12.9999 9.20915 14.7907 11 16.9998 11H19.9998C22.209 11 23.9998 9.20915 23.9998 7V4C23.9998 1.79086 22.209 0 19.9998 0Z" fill="currentColor" />
        <path d="M6.99999 13H3.99999C1.79085 13 -7.62939e-06 14.7909 -7.62939e-06 17V20C-7.62939e-06 22.2092 1.79085 24 3.99999 24H6.99999C9.20913 24 11 22.2092 11 20V17C11 14.7909 9.20913 13 6.99999 13Z" fill="currentColor" />
        <path d="M19.9998 13H16.9998C14.7907 13 12.9999 14.7909 12.9999 17V20C12.9999 22.2092 14.7907 24 16.9998 24H19.9998C22.209 24 23.9998 22.2092 23.9998 20V17C23.9998 14.7909 22.209 13 19.9998 13Z" fill="currentColor" />
      </g>
      <defs>
        <clipPath id="clip0_home_lib">
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

export function IconInscription({ className = 'h-5 w-5', 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden={ariaHidden}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  );
}

export function IconAssociation({ className = 'h-5 w-5', 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden={ariaHidden} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function IconSalle({ className = 'h-5 w-5', 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden={ariaHidden} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 4h3a2 2 0 0 1 2 2v14" />
      <path d="M2 20h20" />
      <path d="M13 20V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v16" />
      <circle cx="9" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

export function IconMateriel({ className = 'h-5 w-5', 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden={ariaHidden} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

/**
 * Icône Subvention : Euro & Financement clair
 */
export function IconSubvention({ className = 'h-5 w-5', 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden={ariaHidden} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M15 9.5a4 4 0 0 0-3.5-1.5 4 4 0 0 0 0 8 4 4 0 0 0 3.5-1.5" />
      <line x1="8" y1="11" x2="13.5" y2="11" />
      <line x1="8" y1="13" x2="13.5" y2="13" />
    </svg>
  );
}

export function IconModule({ className = 'h-5 w-5', 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden={ariaHidden} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

export function IconAgent({ className = 'h-5 w-5', 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden={ariaHidden} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <polyline points="16 11 18 13 22 9" />
    </svg>
  );
}

export function IconHistorique({ className = 'h-5 w-5', 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden={ariaHidden} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}

export function IconEvenement({ className = 'h-5 w-5', 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden={ariaHidden} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

export function IconProfil({ className = 'h-5 w-5', 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden={ariaHidden} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 19C15 15.134 11.866 12 8 12C4.13401 12 1 15.134 1 19M8 9C5.79086 9 4 7.20914 4 5C4 2.79086 5.79086 1 8 1C10.2091 1 12 2.79086 12 5C12 7.20914 10.2091 9 8 9Z" />
    </svg>
  );
}

// ==========================================
// 2. Annuaire / Association Details Icons
// ==========================================

export function IconMembres({ className = 'h-4 w-4', 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden={ariaHidden}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function IconCategorie({ className = 'h-4 w-4', 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden={ariaHidden}>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

export function IconPresidence({ className = 'h-4 w-4', 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden={ariaHidden}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function IconEmail({ className = 'h-4 w-4', 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden={ariaHidden}>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

export function IconTelephone({ className = 'h-4 w-4', 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden={ariaHidden}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

export function IconInfo({ className = 'h-4 w-4', 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden={ariaHidden}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

export function IconLocation({ className = 'h-4 w-4', 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden={ariaHidden}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function IconDocument({ className = 'h-4 w-4', 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden={ariaHidden}>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
}

export function IconPresentation({ className = 'h-4 w-4', 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden={ariaHidden}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function IconChevronRight({ className = 'h-4 w-4', 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden={ariaHidden}>
      <path d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

export function IconChevronLeft({ className = 'h-4 w-4', 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden={ariaHidden}>
      <path d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  );
}

// ==========================================
// 3. Document Management Icons
// ==========================================

export function IconEye({ className = 'h-4 w-4', 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden={ariaHidden}>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function IconDownload({ className = 'h-4 w-4', 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden={ariaHidden}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

export function IconEdit({ className = 'h-4 w-4', 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden={ariaHidden}>
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}

export function IconTrash({ className = 'h-4 w-4', 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden={ariaHidden}>
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

export function IconCheck({ className = 'h-4 w-4', 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden={ariaHidden}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function IconUpload({ className = 'h-4 w-4', 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden={ariaHidden}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

export function IconDoubleChevronLeft({ className = 'h-4 w-4', 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden={ariaHidden}>
      <path d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
    </svg>
  );
}

export function IconDoubleChevronRight({ className = 'h-4 w-4', 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden={ariaHidden}>
      <path d="M5.25 4.5l7.5 7.5-7.5 7.5m6-15l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

export function IconPdfFile({ className = 'h-8 w-8', 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg viewBox="0 0 32 36" className={className} fill="none" aria-hidden={ariaHidden}>
      <path d="M20 2H6C4.89543 2 4 2.89543 4 4V32C4 33.1046 4.89543 34 6 34H26C27.1046 34 28 33.1046 28 32V10L20 2Z" className="stroke-primary fill-paper" strokeWidth="2" strokeLinejoin="round" />
      <path d="M20 2V10H28" className="stroke-primary" strokeWidth="2" strokeLinejoin="round" />
      <text x="7" y="24" className="fill-primary" fontSize="7" fontWeight="bold" fontFamily="sans-serif">PDF</text>
    </svg>
  );
}

export function IconImageFile({ className = 'h-8 w-8', 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg viewBox="0 0 32 36" className={className} fill="none" aria-hidden={ariaHidden}>
      <path d="M20 2H6C4.89543 2 4 2.89543 4 4V32C4 33.1046 4.89543 34 6 34H26C27.1046 34 28 33.1046 28 32V10L20 2Z" className="stroke-primary fill-paper" strokeWidth="2" strokeLinejoin="round" />
      <path d="M20 2V10H28" className="stroke-primary" strokeWidth="2" strokeLinejoin="round" />
      <text x="7" y="24" className="fill-primary" fontSize="7" fontWeight="bold" fontFamily="sans-serif">IMG</text>
    </svg>
  );
}

export function IconGenericFile({ className = 'h-8 w-8', 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg viewBox="0 0 32 36" className={className} fill="none" aria-hidden={ariaHidden}>
      <path d="M20 2H6C4.89543 2 4 2.89543 4 4V32C4 33.1046 4.89543 34 6 34H26C27.1046 34 28 33.1046 28 32V10L20 2Z" className="stroke-primary fill-paper" strokeWidth="2" strokeLinejoin="round" />
      <path d="M20 2V10H28" className="stroke-primary" strokeWidth="2" strokeLinejoin="round" />
      <text x="7" y="24" className="fill-primary" fontSize="7" fontWeight="bold" fontFamily="sans-serif">DOC</text>
    </svg>
  );
}
