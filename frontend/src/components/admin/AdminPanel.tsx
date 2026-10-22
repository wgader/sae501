import { type ReactNode } from 'react';

type AdminPanelProps = {
  children: ReactNode;
  className?: string;
};

export default function AdminPanel({ children, className = '' }: AdminPanelProps) {
  return (
    <section className={`rounded-xl border border-[var(--line)] bg-[var(--White)] shadow-xs ${className}`}>
      {children}
    </section>
  );
}
