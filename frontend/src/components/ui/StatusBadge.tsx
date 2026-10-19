import { type AssociationStatus } from '@/lib/api';

interface StatusBadgeProps {
  status: AssociationStatus;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export default function StatusBadge({
  status,
  label,
  size = 'sm',
  className = '',
}: StatusBadgeProps) {
  const sizeClasses =
    size === 'md'
      ? 'px-3.5 py-1 text-xs'
      : 'px-3 py-0.5 text-xs';

  if (status === 'PENDING_VALIDATION') {
    return (
      <span
        className={`inline-block rounded-full bg-[var(--Lime-Cream)] font-bold text-[var(--ink)] ${sizeClasses} ${className}`}
      >
        {label || 'En attente'}
      </span>
    );
  }

  if (status === 'VALIDATED') {
    return (
      <span
        className={`inline-block rounded-full bg-emerald-100 font-bold text-emerald-800 ${sizeClasses} ${className}`}
      >
        {label || 'Accepté'}
      </span>
    );
  }

  return (
    <span
      className={`inline-block rounded-full bg-rose-100 font-bold text-rose-800 ${sizeClasses} ${className}`}
    >
      {label || 'Refusé'}
    </span>
  );
}
