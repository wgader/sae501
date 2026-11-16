import type { CampaignStatus } from '@/lib/api/types';

interface CampaignStatusBadgeProps {
  status: CampaignStatus | string;
  className?: string;
}

export default function CampaignStatusBadge({ status, className = '' }: CampaignStatusBadgeProps) {
  const normalized = status.toUpperCase();

  switch (normalized) {
    case 'ACTIVE':
    case 'EN COURS':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-600/20 ${className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
          En cours
        </span>
      );

    case 'PROGRAMMED':
    case 'PROGRAMMÉE':
    case 'À VENIR':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800 ring-1 ring-sky-600/20 ${className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-sky-500" aria-hidden="true" />
          Programmée
        </span>
      );

    case 'CLOSED':
    case 'CLÔTURÉE':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-300 ${className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" aria-hidden="true" />
          Clôturée
        </span>
      );

    default:
      return (
        <span
          className={`inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 ${className}`}
        >
          {status}
        </span>
      );
  }
}

