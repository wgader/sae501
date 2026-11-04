'use client';

import { ReactNode } from 'react';
import Link from 'next/link';

export interface DashboardActionCardProps {
  step: string;
  tag: string;
  title: ReactNode;
  description: string;
  href: string;
  bgClass: string;
  isDark?: boolean;
}

export default function DashboardActionCard({
  step,
  tag,
  title,
  description,
  href,
  bgClass,
  isDark = false,
}: DashboardActionCardProps) {
  const textColor = isDark ? 'text-white' : 'text-ink';
  const tagColor = isDark ? 'text-white/70' : 'text-ink/65';
  const descColor = isDark ? 'text-white/80' : 'text-ink/80';
  const borderColor = isDark ? 'border-white/20' : 'border-ink/10';
  const circleBorder = isDark ? 'border-white/20' : 'border-ink/5';

  return (
    <div className="h-full">
      <Link
        href={href}
        className={`group relative flex min-h-76 h-full flex-col justify-between overflow-hidden rounded-card p-6 shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl active:scale-98 ${bgClass} ${textColor}`}
      >
        <span
          className={`pointer-events-none absolute -bottom-8 -right-8 size-32 rounded-full border-14 ${circleBorder} transition-transform duration-300 group-hover:scale-110`}
          aria-hidden="true"
        />

        <div className="relative z-10">
          <div className="flex items-center justify-between text-label font-bold uppercase tracking-kicker">
            <span className={tagColor}>{tag}</span>
            <span className={tagColor}>{step}</span>
          </div>

          <h3 className="mt-6 text-[1.4rem] font-black leading-tight tracking-subheading">
            {title}
          </h3>

          <p className={`mt-3 text-body-sm leading-normal ${descColor}`}>
            {description}
          </p>
        </div>

        <div className={`relative z-10 mt-6 flex items-center justify-between border-t ${borderColor} pt-4`}>
          <span className="text-label font-bold uppercase tracking-kicker">
            Démarrer
          </span>
          <span
            className={`grid h-8 w-8 place-items-center rounded-full transition-transform duration-200 group-hover:scale-110 ${
              isDark ? 'bg-white text-indigo' : 'bg-ink text-white'
            }`}
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14" />
              <path d="M12 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </Link>
    </div>
  );
}
