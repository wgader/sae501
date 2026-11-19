import { cva, type VariantProps } from 'class-variance-authority';
import { IconCheck, IconClose } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

const markerVariants = cva('mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-pill', {
  variants: {
    kind: {
      yes: 'bg-primary text-white',
      no: 'bg-ink/8 text-muted',
      onTone: 'bg-current/15 text-current',
    },
  },
  defaultVariants: { kind: 'yes' },
});

interface CheckListProps extends VariantProps<typeof markerVariants> {
  items: ReadonlyArray<string>;
  className?: string;
}

export default function CheckList({ items, kind, className }: CheckListProps) {
  const Icon = kind === 'no' ? IconClose : IconCheck;

  return (
    <ul className={cn('space-y-3', className)}>
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-body-sm leading-copy">
          <span className={markerVariants({ kind })} aria-hidden="true">
            <Icon className="size-3" />
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
