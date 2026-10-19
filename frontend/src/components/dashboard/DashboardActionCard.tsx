'use client';

import { ReactNode } from 'react';
import Link from 'next/link';

export interface DashboardActionCardProps {
  step: string;
  tag: string;
  title: ReactNode;
  description: string;
  href: string;
  bgColor: string;
  isDark?: boolean;
}

export default function DashboardActionCard({
  step,
  tag,
  title,
  description,
  href,
  bgColor,
  isDark = false,
}: DashboardActionCardProps) {
  const textColor = isDark ? 'text-[var(--White)]' : 'text-[var(--ink)]';
  const tagColor = isDark ? 'text-[var(--White)]/70' : 'text-[var(--ink)]/65';
  const descColor = isDark ? 'text-[var(--White)]/80' : 'text-[var(--ink)]/80';
  const borderColor = isDark ? 'border-[var(--White)]/20' : 'border-[var(--ink)]/10';
  const circleBorder = isDark ? 'border-[var(--White)]/20' : 'border-[var(--ink)]/[0.06]';

  return (
    <div className="h-full">
      <Link
        href={href}
        style={{ backgroundColor: bgColor }}
        className={`group relative flex min-h-[305px] h-full flex-col justify-between overflow-hidden rounded-[22px] p-6 shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl active:scale-[0.98] ${textColor}`}
      >
        <span
          className={`pointer-events-none absolute -bottom-8 -right-8 h-32 w-32 rounded-full border-[14px] ${circleBorder} transition-transform duration-300 group-hover:scale-110`}
          aria-hidden="true"
        />

        <div className="relative z-10">
          <div className="flex items-center justify-between text-[0.6875rem] font-bold uppercase tracking-[0.16em]">
            <span className={tagColor}>{tag}</span>
            <span className={tagColor}>{step}</span>
          </div>

          <h3 className="mt-6 text-[1.4rem] font-black leading-[1.12] tracking-[-0.02em]">
            {title}
          </h3>

          <p className={`mt-3 text-[0.875rem] leading-[1.5] ${descColor}`}>
            {description}
          </p>
        </div>

        <div className={`relative z-10 mt-6 flex items-center justify-between border-t ${borderColor} pt-4`}>
          <span className="text-[0.6875rem] font-bold uppercase tracking-[0.16em]">
            Démarrer
          </span>
          <span
            className={`grid h-8 w-8 place-items-center rounded-full transition-transform duration-200 group-hover:scale-110 ${
              isDark ? 'bg-[var(--White)] text-[var(--Indigo-Bloom)]' : 'bg-[var(--ink)] text-[var(--White)]'
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
