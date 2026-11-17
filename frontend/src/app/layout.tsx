import type { ReactNode } from 'react';
import { Lato } from 'next/font/google';
import { connection } from 'next/server';
import './globals.css';
import AppShell from '@/components/layout/AppShell';

const lato = Lato({
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  variable: '--font-lato',
});

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Rendu à chaque requête : Next.js ne peut poser le nonce de la CSP (voir proxy.ts) que sur une
  // page rendue à la demande, jamais sur une page générée à l'avance.
  await connection();

  return (
    <html lang="fr" className="scroll-smooth" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${lato.variable} flex min-h-screen flex-col bg-white font-sans text-ink antialiased md:flex-row`}
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
