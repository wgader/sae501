'use client';

import { useState } from 'react';

interface FaqItem {
  id: string;
  number: string;
  question: string;
  answer: string;
}

const faqs: FaqItem[] = [
  {
    id: 'faq-1',
    number: '01',
    question: "À qui s'adresse l'espace associations ?",
    answer: "L'espace s'adresse aux associations de Feytiat qui souhaitent effectuer et suivre leurs démarches auprès de la mairie.",
  },
  {
    id: 'faq-2',
    number: '02',
    question: 'Quelles démarches peut-on réaliser en ligne ?',
    answer: 'Vous pouvez notamment déposer une demande de subvention, réserver une salle, demander du matériel ou déclarer un événement associatif.',
  },
  {
    id: 'faq-3',
    number: '03',
    question: 'Puis-je compléter une demande plus tard ?',
    answer: 'Oui. Une démarche peut être complétée progressivement afin de vous laisser le temps de réunir les informations et documents nécessaires.',
  },
  {
    id: 'faq-4',
    number: '04',
    question: "Comment suivre l'avancement de ma demande ?",
    answer: "Chaque démarche reste visible depuis votre espace avec son état d'avancement, les informations transmises et son historique.",
  },
  {
    id: 'faq-5',
    number: '05',
    question: "L'espace remplace-t-il le contact avec la mairie ?",
    answer: 'Non. L' + "espace simplifie les démarches, mais les services municipaux restent disponibles pour vous orienter lorsque votre situation nécessite un accompagnement.",
  },
];

export default function FaqSection() {
  // In the photo, 01 is open by default
  const [openId, setOpenId] = useState<string | null>('faq-1');

  const toggleItem = (id: string) => {
    setOpenId((current) => (current === id ? null : id));
  };

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="scroll-mt-24 py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-340 px-4 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left Column: Heading */}
          <header className="lg:col-span-5">
            <p className="text-meta font-bold uppercase tracking-eyebrow text-moss">
              — Questions fréquentes
            </p>

            <h2
              id="faq-heading"
              className="mt-3 text-[clamp(2rem,3.75vw,2.75rem)] font-black leading-tight tracking-display text-ink"
            >
              Avant de créer<br />
              votre espace.
            </h2>

            <p className="mt-4 max-w-88 text-body leading-copy text-muted">
              Les réponses essentielles pour comprendre le fonctionnement de
              l&apos;espace associations.
            </p>
          </header>

          {/* Right Column: Accordion */}
          <div className="lg:col-span-7">
            <dl className="flex flex-col border-t border-line">
              {faqs.map((item) => {
                const isOpen = openId === item.id;
                return (
                  <div key={item.id} className="border-b border-line">
                    <dt>
                      <button
                        type="button"
                        onClick={() => toggleItem(item.id)}
                        aria-expanded={isOpen}
                        aria-controls={`faq-answer-${item.id}`}
                        className="group flex w-full items-center justify-between gap-4 py-5 text-left transition-colors sm:py-6"
                      >
                        <div className="flex items-center gap-4 sm:gap-6">
                          <span className="text-meta font-bold text-muted">
                            {item.number}
                          </span>
                          <span className="text-body-lg font-bold leading-snug text-ink transition-colors group-hover:text-primary sm:text-lg">
                            {item.question}
                          </span>
                        </div>

                        {/* Plus / Minus indicator matching photo */}
                        <span className="flex size-6 shrink-0 items-center justify-center text-muted transition-colors group-hover:text-ink">
                          {isOpen ? (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                          )}
                        </span>
                      </button>
                    </dt>

                    {/* Collapsible Answer */}
                    {isOpen && (
                      <dd
                        id={`faq-answer-${item.id}`}
                        className="pb-6 pl-8 pr-4 sm:pl-11"
                      >
                        <p className="text-body leading-[1.65] text-muted">
                          {item.answer}
                        </p>
                      </dd>
                    )}
                  </div>
                );
              })}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
