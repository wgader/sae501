export default function HelpSidebar() {
  return (
    <aside className="flex flex-col gap-4">

      <div className="rounded-lg bg-primary-soft p-6 text-sm">
        <h3 className="mb-4 font-bold text-primary">Ce dont vous aurez besoin :</h3>
        <ul className="flex flex-col gap-3 text-moss">
          <li className="flex items-center gap-3">
            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-white text-xs">✓</span>
            Numéro RNA ou SIRET
          </li>
          <li className="flex items-center gap-3">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white text-xs">✓</span>
            Statuts de l&apos;association (PDF)
          </li>
          <li className="flex items-center gap-3">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white text-xs">✓</span>
            Récépissé de préfecture (PDF)
          </li>
          <li className="flex items-center gap-3">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white text-xs">✓</span>
            Liste des membres du bureau (PDF)
          </li>
          <li className="flex items-center gap-3">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white text-xs">✓</span>
            Coordonnées du contact de l&apos;association
          </li>
        </ul>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-sm">
        <h3 className="mb-3 flex items-center gap-2 font-bold text-amber-600">
          ⏱ Délai de validation
        </h3>
        <p className="leading-relaxed text-moss">
          Une fois votre dossier complet soumis, la mairie l&apos;examine sous 48h ouvrées.
          Vous recevrez un email de confirmation.
        </p>
      </div>
    </aside>
  );
}