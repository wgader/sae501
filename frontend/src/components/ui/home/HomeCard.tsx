import type { HTMLAttributes, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const homeCardVariants = cva(
  'flex min-h-[20rem] w-full flex-col rounded-[1.5rem] border border-black/10 px-[1.75rem] pb-[1.75rem] pt-[1.63rem]',
  {
    variants: {
      variant: {
        pink: 'bg-[var(--Misty-Rose)] text-[var(--ink)]',
        green: 'bg-[var(--Lime-Cream)] text-[var(--ink)]',
        purple: 'bg-[var(--Indigo-Bloom)] text-[var(--White)]',
      },
    },
    defaultVariants: {
      variant: 'pink',
    },
  },
);

export const homeCardArrowCircleVariants = cva(
  'grid h-[2.38rem] w-[2.38rem] place-items-center rounded-full',
  {
    variants: {
      variant: {
        pink: 'bg-black text-white',
        green: 'bg-black text-white',
        purple: 'bg-white text-black',
      },
    },
    defaultVariants: {
      variant: 'pink',
    },
  },
);

export interface HomeCardDataProps {
  tag: string;
  number: number | string;
  name: string;
  desc: string;
}

export interface HomeCardProps
  extends HTMLAttributes<HTMLElement>,
    VariantProps<typeof homeCardVariants> {
  children?: ReactNode;
}

export default function HomeCard({
  tag,
  number,
  name,
  desc,
  variant,
  children,
  className,
  ...props
}: HomeCardDataProps & HomeCardProps) {
  return (
    <article
      className={cn(homeCardVariants({ variant }), className)}
      {...props}
    >
      <div className="flex items-start justify-between">
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.11rem]">
          {tag}
        </p>
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.11rem]">
          {String(number).padStart(2, '0')}
        </p>
      </div>

      <div className="mt-[1.13rem] flex flex-1 flex-col justify-end">
        <h3 className="max-w-[20rem] text-[clamp(2.1rem,2.5vw,3.4rem)] font-black leading-[0.96] tracking-[-0.05rem]">
          {name}
        </h3>

        <p className="mt-[0.88rem] max-w-[21.25rem] text-[0.94rem] leading-[1.48] opacity-90">
          {desc}
        </p>
      </div>

      <div className="mt-[1.13rem] flex items-center justify-between border-t border-current/80 pt-[1.13rem]">
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.11rem]">
          Démarrer
        </p>

        <span className={cn(homeCardArrowCircleVariants({ variant }))}>
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-[1.13rem] w-[1.13rem]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h12" />
            <path d="M13 5l7 7-7 7" />
          </svg>
        </span>
      </div>

      {children}
    </article>
  );
}