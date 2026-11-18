import Button from '@/components/ui/Button';
import { IconChevronRight, IconPlus, IconSubvention } from '@/components/ui/icons';
import type { GrantDraft } from '@/lib/api';
import { formatGrantAmount } from '@/lib/grantApplication';

interface GrantDraftListProps {
  drafts: GrantDraft[];
  isCreating: boolean;
  onCreate: () => void;
  onSelect: (draft: GrantDraft) => void;
}

export default function GrantDraftList({ drafts, isCreating, onCreate, onSelect }: GrantDraftListProps) {
  return (
    <section aria-labelledby="grant-drafts-heading" className="mt-6 rounded-card border border-line bg-white p-6 shadow-xs sm:p-10">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <h2 id="grant-drafts-heading" className="text-2xl font-black tracking-tight text-ink">Vos brouillons</h2>
          <p className="mt-1 text-xs text-muted">Reprenez une demande enregistrée ou commencez-en une nouvelle.</p>
        </div>
        <Button onClick={onCreate} isLoading={isCreating} leftIcon={<IconPlus className="h-4 w-4" />}>
          Nouvelle demande
        </Button>
      </header>

      {drafts.length > 0 ? (
        <ul className="mt-6 space-y-3">
          {drafts.map((draft) => (
            <li key={draft.id}>
              <button
                type="button"
                onClick={() => onSelect(draft)}
                className="flex w-full cursor-pointer items-center gap-4 rounded-card border border-line bg-white p-4 text-left transition hover:border-ink/30 hover:shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:p-5"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-soft bg-Misty-Rose text-ink">
                  <IconSubvention className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-bold text-ink">{draft.intituleProjet || 'Demande sans intitulé'}</span>
                  <span className="mt-1 block text-xs text-muted">
                    {draft.typeSubvention} · {formatGrantAmount(draft.montantDemande)}
                  </span>
                </span>
                <span className="hidden rounded-pill bg-Misty-Rose px-3 py-1.5 text-caption font-bold uppercase tracking-label text-ink sm:inline-flex">
                  Brouillon
                </span>
                <IconChevronRight className="h-5 w-5 shrink-0 text-muted" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 rounded-card border border-dashed border-line bg-paper px-6 py-10 text-center text-sm text-muted">
          Aucun brouillon pour le moment. Cliquez sur « Nouvelle demande » pour commencer.
        </p>
      )}
    </section>
  );
}
