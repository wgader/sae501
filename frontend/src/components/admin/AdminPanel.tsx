import { type ReactNode } from 'react';

type AdminPanelProps = {
  children: ReactNode;
  className?: string;
};

export default function AdminPanel({ children, className = '' }: AdminPanelProps) {
  return (
    <section className={`rounded-xl border border-[#B9D8D1] bg-white shadow-[0_8px_24px_rgba(20,110,103,0.05)] ${className}`}>
      {children}
    </section>
  );
}
