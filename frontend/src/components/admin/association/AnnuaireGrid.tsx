import { type Association } from '@/lib/api';
import AnnuaireCard from './AnnuaireCard';
import AnnuaireSkeleton from './AnnuaireSkeleton';

interface AnnuaireGridProps {
  associations: Association[];
  loading: boolean;
  searchTerm?: string;
}

export default function AnnuaireGrid({
  associations,
  loading,
  searchTerm,
}: AnnuaireGridProps) {
  if (loading) {
    return <AnnuaireSkeleton />;
  }

  if (associations.length === 0) {
    return (
      <section className="rounded-[20px] border border-[var(--line)] bg-[var(--paper)] py-16 text-center">
        <p className="text-base font-bold text-[var(--ink)]">
          Aucune association trouvée
        </p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          {searchTerm
            ? `Aucun résultat pour la recherche « ${searchTerm} ».`
            : 'Il n’y a aucune association répertoriée pour le moment.'}
        </p>
      </section>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-5 p-0 list-none sm:grid-cols-2 min-[1200px]:grid-cols-3">
      {associations.map((association, idx) => (
        <li key={association.id} className="h-full">
          <AnnuaireCard association={association} index={idx} />
        </li>
      ))}
    </ul>
  );
}
