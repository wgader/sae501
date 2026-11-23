/**
 * Silhouette de bourg (maisons, clocher, arbres) au bas de l'appel à l'action.
 * Deux plans en aplats pleins : le fond reprend la couleur de survol, le premier plan est blanc.
 */
export default function VillageSkyline({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 200" fill="none" preserveAspectRatio="xMidYMax slice" aria-hidden="true" className={className}>
      <circle cx="905" cy="64" r="30" className="fill-brand-dot" />

      <g className="fill-primary-hover">
        <path d="M30 200V118l70-50 70 50v82Z" />
        <path d="M250 200v-96h120v96Z" />
        <path d="M520 200V110l62-46 62 46v90Z" />
        <path d="M760 200v-84h110v84Z" />
        <path d="M1010 200V112l72-52 72 52v88Z" />
      </g>

      <g className="fill-white">
        <path d="M0 200v-14h1200v14Z" />
        <path d="M110 186v-50l48-36 48 36v50Z" />
        <circle cx="248" cy="138" r="26" />
        <rect x="245" y="150" width="6" height="36" />
        <path d="M300 186v-44l40-30 40 30v44Z" />
        <path d="M454 186V96h36v90Z" />
        <path d="M450 98l22-68 22 68Z" />
        <path d="M520 186v-40l44-32 44 32v40Z" />
        <path d="M660 186v-54l52-38 52 38v54Z" />
        <circle cx="828" cy="142" r="22" />
        <rect x="825" y="152" width="6" height="34" />
        <path d="M880 186v-42l42-30 42 30v42Z" />
        <path d="M1040 186v-48l46-34 46 34v48Z" />
      </g>

      <g className="fill-primary">
        <rect x="150" y="160" width="16" height="26" rx="8" />
        <rect x="334" y="164" width="12" height="22" rx="6" />
        <rect x="464" y="120" width="16" height="22" rx="8" />
        <rect x="702" y="158" width="20" height="28" rx="10" />
        <rect x="914" y="164" width="14" height="22" rx="7" />
        <rect x="1078" y="162" width="16" height="24" rx="8" />
      </g>
    </svg>
  );
}
