'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { cva } from 'class-variance-authority';
import ModuleIllustration from './illustrations/ModuleIllustration';
import BrandDot from './ui/BrandDot';
import LandingContainer from './ui/LandingContainer';
import Reveal from './ui/Reveal';
import SectionTitle from './ui/SectionTitle';
import { LANDING_ANCHORS, LANDING_MODULES, type ModuleId } from './landingContent';

const panelVariants = cva('relative flex h-full flex-col overflow-hidden rounded-panel p-7 sm:p-10', {
  variants: {
    tone: {
      grants: 'bg-module-grants text-ink',
      rooms: 'bg-module-rooms text-ink',
      equipment: 'bg-module-equipment text-white',
      events: 'bg-module-events text-ink',
    },
  },
});

const chipVariants = cva('flex size-10 shrink-0 items-center justify-center rounded-soft transition-colors', {
  variants: {
    tone: {
      grants: 'bg-module-grants text-ink',
      rooms: 'bg-module-rooms text-ink',
      equipment: 'bg-module-equipment text-white',
      events: 'bg-module-events text-primary',
    },
  },
});

/** Les quatre modules : un onglet par module, une illustration qui change avec lui. */
export default function ModulesSection() {
  const [activeId, setActiveId] = useState<ModuleId>('grants');
  const active = LANDING_MODULES.find((module) => module.id === activeId) ?? LANDING_MODULES[0];

  return (
    <section id={LANDING_ANCHORS.modules} aria-labelledby="modules-title" className="scroll-mt-28 bg-white pt-48 pb-24 sm:pt-60 sm:pb-32">
      <LandingContainer className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <Reveal>
            <SectionTitle id="modules-title" title={<>Un compte, quatre modules<BrandDot /></>} />
          </Reveal>

          <Reveal delay={0.1}>
            <div role="tablist" aria-label="Modules de l’espace associations" aria-orientation="vertical" className="mt-10 space-y-2">
              {LANDING_MODULES.map((module) => {
                const Icon = module.icon;
                const isActive = module.id === activeId;
                return (
                  <button
                    key={module.id}
                    type="button"
                    role="tab"
                    id={`module-tab-${module.id}`}
                    aria-selected={isActive}
                    aria-controls="module-panel"
                    onClick={() => setActiveId(module.id)}
                    onMouseEnter={() => setActiveId(module.id)}
                    className={`flex w-full cursor-pointer items-center gap-4 rounded-card border p-3 pr-5 text-left transition-all duration-200 ${
                      isActive ? 'border-line bg-paper shadow-card' : 'border-transparent hover:bg-paper/60'
                    }`}
                  >
                    <span className={chipVariants({ tone: module.id })}>
                      <Icon className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-body-lg font-bold text-ink">{module.name}</span>
                      <span className="block truncate text-body-sm text-muted">{module.title}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.15} className="lg:col-span-7">
          <div id="module-panel" role="tabpanel" aria-labelledby={`module-tab-${active.id}`} className="h-full min-h-112">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className={panelVariants({ tone: active.id })}
              >
                <motion.div
                  initial={{ y: 16 }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-1 items-center justify-center py-4"
                >
                  <ModuleIllustration module={active.id} className="w-full max-w-sm" />
                </motion.div>
                <h3 className="text-2xl font-black tracking-subheading sm:text-3xl">{active.title}</h3>
                <p className="mt-2 max-w-md text-body leading-copy opacity-80">{active.text}</p>
                <ul className="mt-6 flex flex-wrap gap-2">
                  {active.points.map((point) => (
                    <li key={point} className="rounded-pill bg-white/60 px-3.5 py-1.5 text-meta font-bold text-ink">
                      {point}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>
          </div>
        </Reveal>
      </LandingContainer>
    </section>
  );
}
