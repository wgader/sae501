interface GrantPageHeaderProps {
  title: string;
  description: string;
}

/** Bandeau du module, dans la couleur des subventions présente sur l'accueil. */
export default function GrantPageHeader({ title, description }: GrantPageHeaderProps) {
  return (
    <header className="rounded-card bg-Misty-Rose px-6 py-6 sm:px-8 sm:py-7">
      <p className="text-label font-bold uppercase tracking-eyebrow text-ink/70">Espace associations · Financer</p>
      <h1 className="mt-2 text-4xl font-black tracking-display text-ink">{title}</h1>
      <p className="mt-1 text-sm text-ink/70">{description}</p>
    </header>
  );
}
