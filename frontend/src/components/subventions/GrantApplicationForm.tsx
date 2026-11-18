'use client';

import { type FormEvent, useEffect, useMemo, useState } from 'react';
import {
  createGrantDraft,
  getGrantDocuments,
  getGrantDrafts,
  getMediaUrl,
  type GrantBudgetLine,
  type GrantDocument,
  type GrantDraft,
  type GrantDraftInput,
  uploadGrantDocument,
  updateGrantDraft,
} from '@/lib/api';

type Step = 'project' | 'documents';

type FormState = {
  typeSubvention: 'Fonctionnement' | 'Projet';
  intituleProjet: string;
  description: string;
  publicCible: string;
  dateDebutProjet: string;
  dateFinProjet: string;
  montantDemande: string;
  bic: string;
  iban: string;
  lignesBudget: GrantBudgetLine[];
};

const municipalGrantLine: GrantBudgetLine = {
  type: 'recette',
  categorie: 'subvention_mairie',
  intitule: 'Subvention demandée à la mairie',
  montant: '0.00',
};

function createEmptyForm(): FormState {
  return {
    typeSubvention: 'Projet',
    intituleProjet: 'Demande de subvention',
    description: '',
    publicCible: '',
    dateDebutProjet: '',
    dateFinProjet: '',
    montantDemande: '',
    bic: '',
    iban: '',
    lignesBudget: [municipalGrantLine],
  };
}

function formFromDraft(draft: GrantDraft): FormState {
  return {
    typeSubvention: draft.typeSubvention,
    intituleProjet: draft.intituleProjet,
    description: draft.description ?? '',
    publicCible: draft.publicCible ?? '',
    dateDebutProjet: draft.dateDebutProjet ?? '',
    dateFinProjet: draft.dateFinProjet ?? '',
    montantDemande: draft.montantDemande,
    bic: draft.bic ?? '',
    iban: draft.iban ?? '',
    lignesBudget: [
      ...(Array.isArray(draft.lignesBudget)
        ? draft.lignesBudget.filter((line) => line.categorie !== 'subvention_mairie')
        : []),
      { ...municipalGrantLine, montant: draft.montantDemande },
    ],
  };
}

function toPayload(form: FormState): GrantDraftInput {
  return {
    ...form,
    lignesBudget: form.lignesBudget.map((line) =>
      line.categorie === 'subvention_mairie'
        ? { ...municipalGrantLine, montant: form.montantDemande || '0.00' }
        : line,
    ),
  };
}

function toCents(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (normalized === '') return 0;
  if (!/^\d+(?:\.\d{0,2})?$/.test(normalized)) return null;

  const [whole, fraction = ''] = normalized.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}

function normalizeBankingCode(value: string): string {
  return value.replace(/\s/g, '').toUpperCase();
}

function isValidBic(value: string): boolean {
  return /^[A-Z]{6}[A-Z0-9]{2}(?:[A-Z0-9]{3})?$/.test(normalizeBankingCode(value));
}

function isValidIban(value: string): boolean {
  const iban = normalizeBankingCode(value);
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/.test(iban) || iban.length < 15 || iban.length > 34) {
    return false;
  }

  const rearranged = `${iban.slice(4)}${iban.slice(0, 4)}`;
  const numeric = rearranged.replace(/[A-Z]/g, (letter) => String(letter.charCodeAt(0) - 55));
  let remainder = 0;
  for (const digit of numeric) remainder = (remainder * 10 + Number(digit)) % 97;
  return remainder === 1;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export default function GrantApplicationForm() {
  const [drafts, setDrafts] = useState<GrantDraft[]>([]);
  const [activeDraft, setActiveDraft] = useState<GrantDraft | null>(null);
  const [form, setForm] = useState<FormState>(createEmptyForm);
  const [step, setStep] = useState<Step>('project');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pageError, setPageError] = useState('');
  const [documentError, setDocumentError] = useState('');
  const [notice, setNotice] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [documents, setDocuments] = useState<GrantDocument[]>([]);
  const [documentType, setDocumentType] = useState('Rapport moral');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  useEffect(() => {
    let active = true;
    getGrantDrafts()
      .then((items) => {
        if (active) setDrafts(items);
      })
      .catch((error: unknown) => {
        console.error('Unable to load grant drafts.', error);
        if (active) setPageError(error instanceof Error ? error.message : 'Impossible de charger vos brouillons.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!activeDraft) return;

    let active = true;
    getGrantDocuments(activeDraft.id)
      .then((items) => {
        if (active) setDocuments(items);
      })
      .catch((error: unknown) => {
        console.error('Unable to load grant documents.', error);
        if (active) setDocumentError(error instanceof Error ? error.message : 'Impossible de charger les justificatifs.');
      });

    return () => {
      active = false;
    };
  }, [activeDraft]);

  const totals = useMemo(() => {
    let expenses = 0;
    let revenues = 0;
    let hasInvalidAmount = false;
    let hasMissingAmount = false;
    let hasMissingLabel = false;

    for (const line of form.lignesBudget) {
      const cents = line.categorie === 'subvention_mairie'
        ? toCents(form.montantDemande)
        : toCents(line.montant);
      if (cents === null) {
        hasInvalidAmount = true;
        continue;
      }

      if (line.type === 'depense') expenses += cents;
      else revenues += cents;

      if (line.categorie !== 'subvention_mairie' && line.intitule.trim() === '') hasMissingLabel = true;
      if (line.categorie !== 'subvention_mairie' && line.montant.trim() === '') hasMissingAmount = true;
    }

    const requestedAmount = toCents(form.montantDemande);
    return {
      expenses,
      revenues,
      difference: expenses - revenues,
      balanced: expenses === revenues,
      hasInvalidAmount,
      hasMissingAmount,
      hasMissingLabel,
      requestedIsValid: requestedAmount !== null && requestedAmount > 0,
    };
  }, [form]);

  function applyDraft(draft: GrantDraft) {
    setActiveDraft(draft);
    setForm(formFromDraft(draft));
    setStep(draft.budgetValide ? 'documents' : 'project');
    setFieldErrors({});
    setDocumentError('');
    setPageError('');
    setNotice('');
    setSelectedFile(null);
    setDocuments([]);
  }

  async function createDraft(): Promise<GrantDraft | null> {
    setSaving(true);
    setPageError('');
    try {
      const draft = await createGrantDraft(toPayload(createEmptyForm()));
      setActiveDraft(draft);
      setDrafts((current) => [draft, ...current]);
      setForm(createEmptyForm());
      setStep('project');
      setDocuments([]);
      return draft;
    } catch (error) {
      console.error('Unable to create grant draft.', error);
      setPageError(error instanceof Error ? error.message : 'Impossible de créer le brouillon.');
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function saveDraft(): Promise<GrantDraft | null> {
    setSaving(true);
    setPageError('');
    setNotice('');
    try {
      const payload = toPayload(form);
      const saved = activeDraft
        ? await updateGrantDraft(activeDraft.id, payload)
        : await createGrantDraft(payload);

      setActiveDraft(saved);
      setDrafts((current) => [saved, ...current.filter((draft) => draft.id !== saved.id)]);
      setNotice('Votre brouillon a été enregistré.');
      return saved;
    } catch (error) {
      console.error('Unable to save grant draft.', error);
      setPageError(error instanceof Error ? error.message : 'Impossible d’enregistrer le brouillon.');
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function continueToDocuments() {
    const errors: Record<string, string> = {};
    if (!form.intituleProjet.trim()) errors.intituleProjet = 'Le nom de la demande est obligatoire.';
    if (!totals.requestedIsValid) errors.montantDemande = 'Le montant demandé doit être un montant positif.';
    if (totals.requestedIsValid) {
      const cents = toCents(form.montantDemande);
      if (cents !== null && cents > 100_000_000) {
        errors.montantDemande = 'Le montant demandé dépasse la limite autorisée de 1 000 000 €.';
      }
    }
    if (!form.bic.trim()) errors.bic = 'Le BIC est obligatoire.';
    else if (!isValidBic(form.bic)) errors.bic = 'Le BIC doit contenir 8 ou 11 caractères au format bancaire.';
    if (!form.iban.trim()) errors.iban = 'L’IBAN est obligatoire.';
    else if (!isValidIban(form.iban)) errors.iban = 'L’IBAN est incomplet ou invalide.';

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const saved = await saveDraft();
    if (saved) {
      setActiveDraft(saved);
      setStep('documents');
      setFieldErrors({});
      setNotice('Votre demande a été enregistrée. Vous pouvez maintenant ajouter les pièces justificatives.');
    }
  }

  async function uploadDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeDraft || !selectedFile) {
      setDocumentError('Sélectionnez un fichier à téléverser.');
      return;
    }

    setUploading(true);
    setDocumentError('');
    try {
      const document = await uploadGrantDocument(activeDraft.id, selectedFile, documentType);
      setDocuments((current) => [...current, document]);
      setSelectedFile(null);
      setFileInputKey((current) => current + 1);
      setNotice('Le justificatif a été téléversé.');
    } catch (error) {
      console.error('Unable to upload grant document.', error);
      setDocumentError(error instanceof Error ? error.message : 'Impossible de téléverser ce justificatif.');
    } finally {
      setUploading(false);
    }
  }

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function returnToDraftList() {
    setActiveDraft(null);
    setForm(createEmptyForm());
    setStep('project');
    setPageError('');
    setNotice('');
    setDocumentError('');
    setDocuments([]);
  }

  const fieldClass = (field: string) =>
    `mt-1.5 w-full rounded-control border bg-paper px-4 text-sm text-ink outline-none focus:ring-2 ${
      fieldErrors[field]
        ? 'border-danger focus:border-danger focus:ring-danger/20'
        : 'border-line focus:border-primary focus:ring-primary/20'
    }`;

  if (loading) {
    return (
      <main className="min-h-screen bg-paper px-5 py-8 sm:px-8 lg:px-12">
        <p role="status" className="mx-auto max-w-4xl text-sm text-muted">Chargement de vos brouillons…</p>
      </main>
    );
  }

  if (!activeDraft) {
    return (
      <main className="min-h-screen bg-paper px-5 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-4xl">
          <button type="button" onClick={() => window.history.back()} className="mb-5 text-xs font-bold uppercase tracking-label text-muted hover:text-primary">
            ← Retour
          </button>
          <header>
            <p className="text-label font-bold uppercase tracking-eyebrow text-primary">Financer mon projet</p>
            <h1 className="mt-2 text-3xl font-black tracking-display text-ink sm:text-4xl">Demandes de subvention</h1>
            <p className="mt-2 max-w-2xl text-sm leading-copy text-muted">
              Préparez une demande d’aide au fonctionnement ou le financement d’un projet ou événement.
            </p>
          </header>

          {pageError && <p role="alert" className="mt-6 rounded-control border border-danger/30 bg-danger/5 p-4 text-sm text-danger">{pageError}</p>}

          <section aria-labelledby="grant-drafts-heading" className="mt-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 id="grant-drafts-heading" className="text-xl font-bold text-ink">Vos brouillons</h2>
                <p className="mt-1 text-sm text-muted">Reprenez une demande enregistrée ou commencez-en une nouvelle.</p>
              </div>
              <button
                type="button"
                onClick={createDraft}
                disabled={saving}
                className="inline-flex h-11 items-center justify-center rounded-control bg-primary px-5 text-xs font-bold uppercase tracking-label text-white hover:bg-primary-hover disabled:cursor-wait disabled:opacity-60"
              >
                {saving ? 'Création…' : 'Nouvelle demande'}
              </button>
            </div>

            {drafts.length > 0 ? (
              <ul className="mt-5 grid gap-3">
                {drafts.map((draft) => (
                  <li key={draft.id}>
                    <button
                      type="button"
                      onClick={() => applyDraft(draft)}
                      className="flex w-full flex-wrap items-center justify-between gap-4 rounded-card border border-line bg-paper p-5 text-left hover:border-primary"
                    >
                      <span>
                        <span className="block font-bold text-ink">{draft.intituleProjet || 'Demande sans intitulé'}</span>
                        <span className="mt-1 block text-xs text-muted">
                          {draft.typeSubvention} · Brouillon
                        </span>
                      </span>
                      <span className="text-xs font-bold uppercase tracking-label text-primary">Reprendre →</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-5 rounded-card border border-dashed border-line bg-paper p-8 text-center text-sm text-muted">
                Aucun brouillon enregistré pour le moment.
              </p>
            )}
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-4xl">
        <button type="button" onClick={returnToDraftList} className="mb-5 text-xs font-bold uppercase tracking-label text-muted hover:text-primary">
          ← Retour
        </button>

        <header>
          <p className="text-label font-bold uppercase tracking-eyebrow text-primary">Financer mon projet</p>
          <h1 className="mt-2 text-3xl font-black tracking-display text-ink sm:text-4xl">Demande de subvention</h1>
          <p className="mt-2 max-w-2xl text-sm leading-copy text-muted">
            Complétez les informations du dossier. Votre progression reste enregistrée en brouillon.
          </p>
        </header>

        {pageError && <p role="alert" className="mt-5 rounded-control border border-danger/30 bg-danger/5 p-4 text-sm text-danger">{pageError}</p>}
        {notice && <p role="status" className="mt-5 rounded-control bg-primary/5 p-4 text-sm text-primary">{notice}</p>}

        {step === 'project' && (
          <section aria-labelledby="project-heading" className="mt-6 overflow-hidden rounded-card border border-line bg-white shadow-xs">
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-5 sm:px-8">
              <div>
                <span className="rounded-pill bg-Misty-Rose px-3 py-1 text-caption font-bold uppercase tracking-label text-danger">NOUVEAU</span>
                <h2 id="project-heading" className="mt-3 text-xl font-bold text-ink">Votre demande</h2>
                <p className="mt-1 text-sm text-muted">Complétez les informations nécessaires à l’étude de votre demande.</p>
              </div>
            </div>

            <div className="grid gap-0">
              <div className="border-b border-line px-5 py-6 sm:px-8">
                <label className="block text-xs font-bold uppercase tracking-label text-ink">
                  Nom de la demande
                  <input
                    value={form.intituleProjet}
                    onChange={(event) => updateField('intituleProjet', event.target.value)}
                    aria-invalid={Boolean(fieldErrors.intituleProjet)}
                    className={`${fieldClass('intituleProjet')} h-12`}
                    placeholder="Exemple : Festival associatif 2026"
                  />
                  {fieldErrors.intituleProjet && <span className="mt-1 block text-xs font-normal text-danger">{fieldErrors.intituleProjet}</span>}
                </label>
              </div>

              <div className="border-b border-line px-5 py-6 sm:px-8">
                <label className="block text-xs font-bold uppercase tracking-label text-ink">
                  Montant de la subvention demandé à la mairie (€)
                  <input type="text" inputMode="decimal" value={form.montantDemande} onChange={(event) => updateField('montantDemande', event.target.value)} aria-invalid={Boolean(fieldErrors.montantDemande)} className={`${fieldClass('montantDemande')} h-12`} placeholder="Exemple : 2000,00" />
                  {fieldErrors.montantDemande && <span className="mt-1 block text-xs font-normal text-danger">{fieldErrors.montantDemande}</span>}
                </label>
              </div>

              <section aria-labelledby="resources-heading" className="border-b border-line px-5 py-6 sm:px-8">
                <span className="rounded-pill bg-Misty-Rose px-3 py-1 text-caption font-bold uppercase tracking-label text-danger">Ressources</span>
                <h3 id="resources-heading" className="mt-3 text-xl font-bold text-ink">Documents utiles</h3>
                <p className="mt-1 text-xs text-muted">Téléchargez les modèles avant de compléter votre dossier.</p>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-ink">Formulaire de subvention à télécharger</p>
                  <div className="flex items-center gap-3">
                    <a href="/assets/cerfa_12156-06-1.pdf" download className="inline-flex h-9 items-center rounded-pill bg-black px-4 text-caption font-bold uppercase tracking-label text-white hover:opacity-90">
                      Télécharger
                    </a>
                    <a href="/assets/notice_5178104-1.pdf" download className="text-xs font-bold text-ink hover:text-primary">
                      Notice
                    </a>
                  </div>
                </div>
              </section>

              <section aria-labelledby="application-notice-heading" className="border-b border-line px-5 py-6 sm:px-8">
                <h3 id="application-notice-heading" className="text-sm font-bold text-ink">Avant de déposer la demande</h3>
                <div className="mt-4 grid gap-4">
                  <p className="text-sm leading-copy text-muted">
                    La rubrique N° 6 n’est à remplir que si vous sollicitez le financement d’une action ou d’un projet ponctuel,
                    anciennement appelé subvention exceptionnelle.
                  </p>
                  <p className="text-sm leading-copy text-muted">
                    Accompagnez votre demande d’un RIB et du rapport moral de la dernière assemblée générale.
                    À défaut, fournissez un bilan de votre activité récente.
                  </p>
                  <p className="text-sm leading-copy text-muted">
                    Pour la partie financière, vous pouvez remplacer les tableaux du dossier par vos propres tableaux de présentation
                    pour la rubrique N° 5, Budget de l’association.
                  </p>
                  <p className="text-sm font-semibold leading-copy text-ink">
                    Dans tous les cas, remplissez attentivement la rubrique N° 7 et signez la demande.
                  </p>
                </div>

                <div className="mt-5 rounded-soft border border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm font-bold text-ink">Contrat d’engagement républicain</p>
                  <p className="mt-2 text-xs leading-copy text-muted">
                    La loi du 24 août 2021 instaure un contrat d’engagement républicain applicable aux associations ou fondations
                    qui demandent une subvention, un agrément ou une reconnaissance d’utilité publique.
                  </p>
                  <div className="mt-3 grid gap-2">
                    <a
                      href="https://www.ville-feytiat.fr/wp-content/uploads/2022/09/22-01-Contrat-Engagement-Republicain-affiche.pdf"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-between gap-3 rounded-soft border border-line bg-white px-4 py-3 text-xs font-bold text-ink hover:border-primary"
                    >
                      <span>Contrat d’engagement républicain — affiche</span>
                      <span className="rounded-pill bg-black px-3 py-1.5 text-caption uppercase text-white">Télécharger</span>
                    </a>
                    <a
                      href="https://www.ville-feytiat.fr/wp-content/uploads/2022/09/2021-12-decret-2021-1947-du-31-decembre-2021-_-contrat-dengagement-republicain.pdf"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-between gap-3 rounded-soft border border-line bg-white px-4 py-3 text-xs font-bold text-ink hover:border-primary"
                    >
                      <span>Décret n° 2021-1947 du 31 décembre 2021</span>
                      <span className="rounded-pill bg-black px-3 py-1.5 text-caption uppercase text-white">Télécharger</span>
                    </a>
                  </div>
                </div>
              </section>

              <fieldset className="px-5 py-7 sm:px-8 sm:py-8">
                <legend className="text-sm font-bold text-ink">Relevé d’identité bancaire (RIB)</legend>
                <p className="mt-3 text-sm text-muted">Renseignez les coordonnées bancaires de l’association.</p>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <label className="block text-xs font-bold text-ink">
                    BIC
                    <input
                      value={form.bic}
                      onChange={(event) => updateField('bic', normalizeBankingCode(event.target.value))}
                      aria-invalid={Boolean(fieldErrors.bic)}
                      className={`${fieldClass('bic')} h-12`}
                      placeholder="XXXXXFRXX"
                      maxLength={11}
                    />
                    {fieldErrors.bic && <span className="mt-1 block text-xs font-normal text-danger">{fieldErrors.bic}</span>}
                  </label>
                  <label className="block text-xs font-bold text-ink">
                    IBAN
                    <input
                      value={form.iban}
                      onChange={(event) => updateField('iban', normalizeBankingCode(event.target.value))}
                      aria-invalid={Boolean(fieldErrors.iban)}
                      className={`${fieldClass('iban')} h-12`}
                      placeholder="FRXX XXXX XXXX XXXX XXXX XXXX XXX"
                      maxLength={34}
                    />
                    {fieldErrors.iban && <span className="mt-1 block text-xs font-normal text-danger">{fieldErrors.iban}</span>}
                  </label>
                </div>
              </fieldset>
            </div>

            <div className="flex flex-wrap justify-between gap-3 border-t border-line px-5 py-5 sm:px-8">
              <p className="self-center text-xs text-muted">Ce formulaire permet de constituer votre demande de subvention.</p>
              <button type="button" onClick={continueToDocuments} disabled={saving} className="h-11 rounded-control bg-primary px-5 text-xs font-bold uppercase tracking-label text-white hover:bg-primary-hover disabled:opacity-60">
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </section>
        )}

        {step === 'documents' && (
          <section aria-labelledby="documents-heading" className="mt-6 rounded-card border border-line bg-white p-5 sm:p-8">
            <span className="rounded-pill bg-primary-soft px-3 py-1 text-caption font-bold uppercase tracking-label text-primary">Dossier</span>
            <h2 id="documents-heading" className="mt-3 text-xl font-bold text-ink">Pièces justificatives</h2>
            <p className="mt-2 max-w-2xl text-sm leading-copy text-muted">
              Votre dossier est conservé au statut « Brouillon ». Ajoutez les pièces nécessaires.
            </p>
            <div className="mt-6 rounded-soft border border-primary/20 bg-primary/5 p-5">
              <p className="font-bold text-ink">Demande enregistrée</p>
              <p className="mt-1 text-sm text-muted">{form.intituleProjet || 'Demande sans intitulé'} · {formatCurrency(toCents(form.montantDemande) ?? 0)}</p>
            </div>

            <form onSubmit={uploadDocument} className="mt-6 rounded-soft border border-line p-5">
              <h3 className="font-bold text-ink">Ajouter un justificatif</h3>
              <p className="mt-1 text-xs leading-copy text-muted">PDF, JPEG, PNG ou WebP · 10 Mo maximum par fichier.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-bold text-ink">
                  Type de document
                  <select value={documentType} onChange={(event) => setDocumentType(event.target.value)} className="mt-1.5 h-11 w-full rounded-control border border-line bg-paper px-3 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                    <option>Rapport moral</option>
                    <option>Bilan d’activité récente</option>
                    <option>Autre justificatif</option>
                  </select>
                </label>
                <label className="block text-xs font-bold text-ink">
                  Fichier
                  <input key={fileInputKey} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} className="mt-1.5 block min-h-11 w-full rounded-control border border-line bg-paper px-3 py-2 text-sm font-normal text-ink file:mr-3 file:rounded-control file:border-0 file:bg-primary file:px-3 file:py-2 file:text-xs file:font-bold file:text-white" />
                </label>
              </div>
              {documentError && <p role="alert" className="mt-3 text-sm text-danger">{documentError}</p>}
              <div className="mt-4 flex justify-end">
                <button type="submit" disabled={uploading || !selectedFile} className="h-10 rounded-control bg-primary px-4 text-xs font-bold uppercase tracking-label text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50">
                  {uploading ? 'Téléversement…' : 'Téléverser le justificatif'}
                </button>
              </div>
            </form>

            <section aria-labelledby="uploaded-documents-heading" className="mt-6">
              <h3 id="uploaded-documents-heading" className="font-bold text-ink">Documents ajoutés</h3>
              {documents.length > 0 ? (
                <ul className="mt-3 divide-y divide-line rounded-soft border border-line px-4">
                  {documents.map((document) => {
                    const url = getMediaUrl(document.fichierUrl) ?? document.fichierUrl;
                    return (
                      <li key={document.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                        <span>
                          <span className="block text-sm font-semibold text-ink">{document.originalName}</span>
                          <span className="mt-1 block text-xs text-muted">{document.typeDocument} · {(document.size / (1024 * 1024)).toFixed(2)} Mo</span>
                        </span>
                        <a href={url} target="_blank" rel="noreferrer" className="text-xs font-bold uppercase tracking-label text-primary hover:underline">Consulter</a>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-3 rounded-soft border border-dashed border-line bg-paper p-4 text-sm text-muted">Aucun justificatif ajouté pour le moment.</p>
              )}
            </section>

            <div className="mt-8 border-t border-line pt-5">
              <button type="button" onClick={() => setStep('project')} className="h-11 rounded-control border border-line px-5 text-xs font-bold uppercase tracking-label text-ink hover:bg-paper">← Modifier la demande</button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
