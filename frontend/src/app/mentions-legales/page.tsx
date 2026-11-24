'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import LandingContainer from '@/components/landing/ui/LandingContainer';
import LandingFooter from '@/components/landing/LandingFooter';
import Notice from '@/components/ui/Notice';
import { getPublicLegal } from '@/lib/api';
import type { LegalContent } from '@/lib/api/types';

export default function MentionsLegalesPage() {
  const [content, setContent] = useState<LegalContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getPublicLegal('mentions_legales')
      .then((data) => {
        if (active) setContent(data);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Impossible de charger les mentions légales.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="border-b border-line bg-white py-4">
        <LandingContainer className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/assets/logo-feytiat.svg" alt="Ville de Feytiat" width={140} height={30} className="h-7 w-auto" />
            <span className="text-body-sm font-bold text-ink">Espace associations</span>
          </Link>
          <Link href="/" className="text-xs font-bold uppercase tracking-label text-primary hover:underline">
            ← Retour à l&apos;accueil
          </Link>
        </LandingContainer>
      </header>

      <main className="flex-1 py-12">
        <LandingContainer className="max-w-4xl">
          {error && <Notice tone="danger" className="mb-6">{error}</Notice>}
          {loading ? (
            <p className="py-20 text-center text-sm text-muted">Chargement des mentions légales…</p>
          ) : content ? (
            <article className="rounded-card border border-line bg-white p-8 sm:p-12 shadow-xs">
              <header className="border-b border-line pb-6">
                <span className="text-label font-bold uppercase tracking-eyebrow text-primary">
                  {content.subtitle ?? 'Informations légales et administratives'}
                </span>
                <h1 className="mt-2 text-3xl font-black text-ink">{content.title}</h1>
                {content.lastUpdated && (
                  <p className="mt-2 text-xs text-muted">Dernière mise à jour : {content.lastUpdated}</p>
                )}
              </header>

              <div className="mt-8 space-y-6">
                {content.sections.map((section, idx) => (
                  <section key={idx} className="space-y-2">
                    <h2 className="text-lg font-bold text-ink">{section.title}</h2>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-muted">{section.text}</p>
                  </section>
                ))}
              </div>
            </article>
          ) : null}
        </LandingContainer>
      </main>

      <LandingFooter />
    </div>
  );
}
