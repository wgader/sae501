// components/signup/Sidebar.tsx
export default function Sidebar() {
  return (
    <aside className="flex flex-col gap-4">

      <div className="rounded-lg bg-[#f2f7f5] p-6 text-sm">
        <h3 className="mb-4 font-bold text-[#0b644d]">Ce dont vous aurez besoin :</h3>
        <ul className="flex flex-col gap-3 text-[#4f5851]">
          <li className="flex items-center gap-3">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0b644d] text-white text-xs">✓</span>
            Numéro RNA ou SIRET
          </li>
          <li className="flex items-center gap-3">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0b644d] text-white text-xs">✓</span>
            Statuts de l'association (PDF)
          </li>
          <li className="flex items-center gap-3">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0b644d] text-white text-xs">✓</span>
            Récépissé de préfecture (PDF)
          </li>
          <li className="flex items-center gap-3">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0b644d] text-white text-xs">✓</span>
            Liste des membres du bureau (PDF)
          </li>
          <li className="flex items-center gap-3">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0b644d] text-white text-xs">✓</span>
            Coordonnées du contact de l'association
          </li>
        </ul>
      </div>

      <div className="rounded-lg border border-[#f5dfc6] bg-[#fdf8f3] p-6 text-sm">
        <h3 className="mb-3 flex items-center gap-2 font-bold text-[#d97706]">
          ⏱ Délai de validation
        </h3>
        <p className="leading-relaxed text-[#4f5851]">
          Une fois votre dossier complet soumis, la mairie l'examine sous 48h ouvrées.
          Vous recevrez un email de confirmation.
        </p>
      </div>
    </aside>
  );
}