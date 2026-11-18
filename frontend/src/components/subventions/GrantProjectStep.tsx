import type { FormEvent } from 'react';
import GrantResourcesPanel from '@/components/subventions/GrantResourcesPanel';
import Button from '@/components/ui/Button';
import FormField from '@/components/ui/FormField';
import { normalizeBankingCode, type GrantFormErrors, type GrantFormState } from '@/lib/grantApplication';

type GrantTextField = 'intituleProjet' | 'montantDemande' | 'bic' | 'iban';

interface GrantProjectStepProps {
  form: GrantFormState;
  errors: GrantFormErrors;
  isSaving: boolean;
  onChange: (field: GrantTextField, value: string) => void;
  onSaveDraft: () => void;
  onContinue: () => void;
  onBack: () => void;
}

const LEGEND_CLASS = 'text-sm font-bold uppercase tracking-wider text-primary';

export default function GrantProjectStep({ form, errors, isSaving, onChange, onSaveDraft, onContinue, onBack }: GrantProjectStepProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onContinue();
  };

  return (
    <div className="mt-6 grid items-start gap-6 lg:grid-cols-12">
      <section aria-labelledby="grant-project-heading" className="rounded-card border border-line bg-white p-6 shadow-xs sm:p-10 lg:col-span-8">
        <header className="border-b border-line pb-5">
          <p className="text-label font-bold uppercase tracking-eyebrow text-muted">Étape 1 sur 2</p>
          <h2 id="grant-project-heading" className="mt-1 text-2xl font-black tracking-tight text-ink">Votre demande</h2>
          <p className="mt-1 text-xs text-muted">Vous pouvez enregistrer un brouillon à tout moment et le compléter plus tard.</p>
        </header>

        <form method="post" noValidate onSubmit={handleSubmit} className="mt-8 space-y-8">
          <fieldset className="space-y-5">
            <legend className={LEGEND_CLASS}>Informations générales</legend>
            <FormField
              label="Nom de la demande"
              value={form.intituleProjet}
              error={errors.intituleProjet}
              aria-invalid={Boolean(errors.intituleProjet)}
              onChange={(event) => onChange('intituleProjet', event.target.value)}
              placeholder="exemple : Festival associatif 2026"
              maxLength={255}
            />
            <FormField
              label="Montant demandé à la mairie (€)"
              inputMode="decimal"
              value={form.montantDemande}
              error={errors.montantDemande}
              aria-invalid={Boolean(errors.montantDemande)}
              onChange={(event) => onChange('montantDemande', event.target.value)}
              placeholder="exemple : 2000,00"
            />
          </fieldset>

          {/* Le filet reste hors du fieldset : le navigateur y incruste sinon la légende. */}
          <div className="border-t border-line pt-8">
            <fieldset className="space-y-5">
              <legend className={LEGEND_CLASS}>Relevé d’identité bancaire</legend>
              <p className="text-xs leading-copy text-muted">Ces deux codes figurent sur le RIB de votre association.</p>
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  label="BIC"
                  value={form.bic}
                  error={errors.bic}
                  aria-invalid={Boolean(errors.bic)}
                  onChange={(event) => onChange('bic', normalizeBankingCode(event.target.value))}
                  placeholder="exemple : CMCIFRPP"
                  maxLength={11}
                  autoComplete="off"
                />
                <FormField
                  label="IBAN"
                  value={form.iban}
                  error={errors.iban}
                  aria-invalid={Boolean(errors.iban)}
                  onChange={(event) => onChange('iban', normalizeBankingCode(event.target.value))}
                  placeholder="exemple : FR76 XXXX XXXX XXXX"
                  maxLength={34}
                  autoComplete="off"
                />
              </div>
            </fieldset>
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
            <Button variant="ghost" onClick={onBack} disabled={isSaving} className="w-full sm:w-auto">Mes demandes</Button>
            <div className="flex w-full flex-wrap gap-3 sm:w-auto">
              <Button variant="secondary" onClick={onSaveDraft} disabled={isSaving} className="w-full sm:w-auto">Enregistrer le brouillon</Button>
              <Button type="submit" isLoading={isSaving} className="w-full sm:w-auto">Continuer</Button>
            </div>
          </footer>
        </form>
      </section>

      <div className="lg:col-span-4">
        <GrantResourcesPanel />
      </div>
    </div>
  );
}
