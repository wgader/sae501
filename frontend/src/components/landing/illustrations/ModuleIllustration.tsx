import type { ComponentType } from 'react';
import type { ModuleId } from '../landingContent';

const STROKE = 'stroke-ink';

/** Pile de pièces d'où pousse une jeune pousse : financer un projet qui grandit. */
function GrantsScene() {
  return (
    <>
      <ellipse cx="120" cy="178" rx="78" ry="8" className="fill-ink/10" />
      {[150, 132, 114].map((y) => (
        <g key={y}>
          <rect x="62" y={y} width="76" height="20" rx="10" className={`fill-white ${STROKE}`} strokeWidth="3" />
          <path d={`M74 ${y + 10}h52`} className={`${STROKE} opacity-25`} strokeWidth="3" />
        </g>
      ))}
      <circle cx="160" cy="138" r="30" className={`fill-accent ${STROKE}`} strokeWidth="3" />
      <path d="M170 126a14 14 0 1 0 0 24M146 134h18M146 142h18" className={`fill-none ${STROKE}`} strokeWidth="3.5" />
      <path d="M100 114V70" className={`fill-none ${STROKE}`} strokeWidth="3" />
      <path d="M100 86c-22 0-30-14-30-26 18 0 30 10 30 26Z" className={`fill-primary ${STROKE}`} strokeWidth="3" />
      <path d="M100 76c0-18 12-30 32-30 0 16-12 30-32 30Z" className={`fill-brand-dot ${STROKE}`} strokeWidth="3" />
    </>
  );
}

/** Façade de salle municipale, porte cintrée et fenêtres éclairées. */
function RoomsScene() {
  return (
    <>
      <ellipse cx="120" cy="180" rx="84" ry="8" className="fill-ink/10" />
      <path d="M48 82 120 40l72 42Z" className={`fill-primary ${STROKE}`} strokeWidth="3" />
      <rect x="56" y="82" width="128" height="92" className={`fill-white ${STROKE}`} strokeWidth="3" />
      <path d="M104 174v-34a16 16 0 0 1 32 0v34Z" className={`fill-primary ${STROKE}`} strokeWidth="3" />
      {[70, 148].map((x) => (
        <g key={x}>
          <rect x={x} y="98" width="22" height="26" rx="11" className={`fill-accent ${STROKE}`} strokeWidth="3" />
          <rect x={x} y="136" width="22" height="22" rx="4" className={`fill-accent ${STROKE}`} strokeWidth="3" />
        </g>
      ))}
      <circle cx="120" cy="68" r="7" className={`fill-white ${STROKE}`} strokeWidth="3" />
      <path d="M44 174h152" className={`fill-none ${STROKE}`} strokeWidth="3" />
    </>
  );
}

/** Barnum, table pliante et chaises : le matériel prêté par la commune. */
function EquipmentScene() {
  return (
    <>
      <ellipse cx="120" cy="180" rx="86" ry="8" className="fill-ink/25" />
      <path d="M40 78 76 46h88l36 32Z" className="fill-white stroke-ink" strokeWidth="3" />
      <path d="M40 78c9 12 18 12 27 0 9 12 18 12 27 0 9 12 18 12 26 0 9 12 18 12 27 0 9 12 18 12 26 0 9 12 18 12 27 0" className="fill-accent stroke-ink" strokeWidth="3" />
      <path d="M46 84v92M194 84v92" className="fill-none stroke-white" strokeWidth="4" />
      <rect x="82" y="128" width="76" height="10" rx="5" className="fill-white stroke-ink" strokeWidth="3" />
      <path d="M92 138l-8 38M148 138l8 38M92 138l56 38M148 138l-56 38" className="fill-none stroke-white" strokeWidth="3" />
      <g className="fill-module-grants stroke-ink" strokeWidth="3">
        <rect x="58" y="138" width="20" height="8" rx="3" />
        <rect x="162" y="138" width="20" height="8" rx="3" />
      </g>
      <path d="M60 114v62M76 146v30M180 114v62M164 146v30" className="fill-none stroke-white" strokeWidth="3" />
    </>
  );
}

/** Calendrier sous une guirlande de fanions : la fête est déclarée. */
function EventsScene() {
  const flags = [
    { x: 40, tone: 'fill-module-grants' },
    { x: 76, tone: 'fill-accent' },
    { x: 112, tone: 'fill-module-equipment' },
    { x: 148, tone: 'fill-brand-dot' },
    { x: 184, tone: 'fill-module-grants' },
  ];

  return (
    <>
      <ellipse cx="120" cy="180" rx="70" ry="8" className="fill-ink/10" />
      <path d="M24 34c60 26 132 26 192 0" className={`fill-none ${STROKE}`} strokeWidth="3" />
      {flags.map(({ x, tone }, index) => (
        <path key={x} d={`M${x} ${40 + (index === 2 ? 6 : index % 2 === 0 ? 2 : 6)}h22l-11 22Z`} className={`${tone} ${STROKE}`} strokeWidth="3" />
      ))}
      <rect x="64" y="78" width="112" height="96" rx="14" className={`fill-white ${STROKE}`} strokeWidth="3" />
      <path d="M64 92a14 14 0 0 1 14-14h84a14 14 0 0 1 14 14v12H64Z" className={`fill-primary ${STROKE}`} strokeWidth="3" />
      <path d="M90 70v18M150 70v18" className={`fill-none ${STROKE}`} strokeWidth="4" />
      {[0, 1, 2, 3].map((col) =>
        [0, 1].map((row) => (
          <circle key={`${col}-${row}`} cx={86 + col * 23} cy={124 + row * 26} r="4" className="fill-ink/20" />
        )),
      )}
      <circle cx="132" cy="150" r="13" className={`fill-accent ${STROKE}`} strokeWidth="3" />
      <path d="m126 150 4 4 8-8" className={`fill-none ${STROKE}`} strokeWidth="3" />
    </>
  );
}

const SCENES: Record<ModuleId, ComponentType> = {
  grants: GrantsScene,
  rooms: RoomsScene,
  equipment: EquipmentScene,
  events: EventsScene,
};

interface ModuleIllustrationProps {
  module: ModuleId;
  className?: string;
}

/** Illustration à plat de chaque module, dessinée avec les couleurs du thème. */
export default function ModuleIllustration({ module, className }: ModuleIllustrationProps) {
  const Scene = SCENES[module];
  return (
    <svg viewBox="0 0 240 200" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <Scene />
    </svg>
  );
}
