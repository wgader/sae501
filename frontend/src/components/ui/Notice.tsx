import type { ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { IconCheck, IconInfo, IconLock, IconWarning } from '@/components/ui/icons';

const noticeVariants = cva('flex items-start gap-3 rounded-soft p-4 text-body-sm text-ink sm:p-5', {
  variants: {
    tone: {
      info: 'bg-paper ring-1 ring-line',
      success: 'bg-primary-soft',
      warning: 'bg-accent/50',
      danger: 'bg-danger/10',
      locked: 'bg-paper ring-1 ring-line',
    },
  },
  defaultVariants: { tone: 'info' },
});

const iconVariants = cva('mt-0.5 h-5 w-5 shrink-0', {
  variants: {
    tone: {
      info: 'text-primary',
      success: 'text-primary',
      warning: 'text-ink',
      danger: 'text-danger',
      locked: 'text-muted',
    },
  },
  defaultVariants: { tone: 'info' },
});

const ICONS = {
  info: IconInfo,
  success: IconCheck,
  warning: IconWarning,
  danger: IconWarning,
  locked: IconLock,
} as const;

interface NoticeProps extends VariantProps<typeof noticeVariants> {
  title?: string;
  children?: ReactNode;
  /** Bouton ou lien d'action affiché sous le message. */
  action?: ReactNode;
  className?: string;
}

/** Message contextuel (information, succès, alerte), annoncé aux lecteurs d'écran. */
export default function Notice({ tone = 'info', title, children, action, className }: NoticeProps) {
  const Icon = ICONS[tone ?? 'info'];
  const urgent = tone === 'danger' || tone === 'warning';

  return (
    <div role={urgent ? 'alert' : 'status'} className={cn(noticeVariants({ tone }), className)}>
      <Icon className={iconVariants({ tone })} />
      <div className="min-w-0 flex-1">
        {title && <p className="font-bold">{title}</p>}
        {children && <div className={cn(title && 'mt-1', 'text-ink/80')}>{children}</div>}
        {action && <div className="mt-3 flex flex-wrap items-center gap-3">{action}</div>}
      </div>
    </div>
  );
}
