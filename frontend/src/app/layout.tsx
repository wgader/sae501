import type { ReactNode } from 'react';
import { Lato } from 'next/font/google';
import './globals.css';
import AppShell from '@/components/layout/AppShell';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
const lato = Lato({
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  variable: '--font-lato',
});

export default function RootLayout({ children }: { children: ReactNode }) {
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
