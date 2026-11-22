'use client';

import { type ChangeEvent, type FormEvent, type KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
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

type TypologieAide = 'Fonctionnement' | 'Projet';

type FormState = {
  typeSubvention: TypologieAide;
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

type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const municipalGrantLine: GrantBudgetLine = {
  type: 'recette',
  categorie: 'subvention_mairie',
  intitule: 'Subvention demandée à la mairie',
  montant: '0.00',
};

function createEmptyForm(): FormState {
  return {
    typeSubvention: 'Projet',
    intituleProjet: '',
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
    typeSubvention: draft.typeSubvention === 'Fonctionnement' ? 'Fonctionnement' : 'Projet',
    intituleProjet: draft.intituleProjet ?? '',
    description: draft.description ?? '',
    publicCible: draft.publicCible ?? '',
    dateDebutProjet: draft.dateDebutProjet ?? '',
    dateFinProjet: draft.dateFinProjet ?? '',
    montantDemande: draft.montantDemande ?? '',
    bic: draft.bic ?? '',
    iban: draft.iban ?? '',
    lignesBudget: [
      ...(Array.isArray(draft.lignesBudget)
        ? draft.lignesBudget.filter((line) => line.categorie !== 'subvention_mairie')
        : []),
      { ...municipalGrantLine, montant: draft.montantDemande ?? '0.00' },
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

export default function GrantApplicationForm() {
  const [drafts, setDrafts] = useState<GrantDraft[]>([]);
  const [activeDraft, setActiveDraft] = useState<GrantDraft | null>(null);
  const [form, setForm] = useState<FormState>(createEmptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCerfa, setUploadingCerfa] = useState(false);
  const [uploadingOther, setUploadingOther] = useState(false);
  const [pageError, setPageError] = useState('');
  const [notice, setNotice] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [documents, setDocuments] = useState<GrantDocument[]>([]);
  const [otherDocumentType, setOtherDocumentType] = useState('Rapport moral');
  const [showDraftList, setShowDraftList] = useState(false);

  // Autosave states
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const formRef = useRef<FormState>(form);
  const activeDraftRef = useRef<GrantDraft | null>(activeDraft);
  const isDirtyRef = useRef(false);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const cerfaFileInputRef = useRef<HTMLInputElement | null>(null);
  const otherFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  useEffect(() => {
    activeDraftRef.current = activeDraft;
  }, [activeDraft]);

  // Load existing drafts on initial render
  useEffect(() => {
    let active = true;
    getGrantDrafts()
      .then((items) => {
        if (!active) return;
        setDrafts(items);
        if (items.length > 0 && !activeDraftRef.current) {
          const latest = items[0];
          setActiveDraft(latest);
          setForm(formFromDraft(latest));
        }
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

  // Load documents for active draft
  useEffect(() => {
    if (!activeDraft) return;

    let active = true;
    getGrantDocuments(activeDraft.id)
      .then((items) => {
        if (active) setDocuments(items);
      })
      .catch((error: unknown) => {
        console.error('Unable to load grant documents.', error);
      });

    return () => {
      active = false;
    };
  }, [activeDraft]);

  // Trigger autosave with debounce (Checklist item 3)
  useEffect(() => {
    if (!isDirtyRef.current) return;
    if (!form.intituleProjet.trim()) return;

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(async () => {
      const currentForm = formRef.current;
      const currentDraft = activeDraftRef.current;
      if (!currentForm.intituleProjet.trim()) return;

      setAutosaveStatus('saving');
      try {
        const payload = toPayload(currentForm);
        const saved = currentDraft
          ? await updateGrantDraft(currentDraft.id, payload)
          : await createGrantDraft(payload);

        setActiveDraft(saved);
        setDrafts((prev) => [saved, ...prev.filter((d) => d.id !== saved.id)]);
        setAutosaveStatus('saved');
        const now = new Date();
        setLastSavedAt(
          now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        );
        isDirtyRef.current = false;
      } catch (err) {
        console.error('Autosave error:', err);
        setAutosaveStatus('error');
      }
    }, 2000);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [form]);

  // Separate cerfa from other documents
  const cerfaDocument = useMemo(() => {
    return documents.find(
      (doc) =>
        doc.typeDocument.toLowerCase().includes('cerfa') ||
        doc.typeDocument.toLowerCase().includes('formulaire') ||
        doc.originalName.toLowerCase().includes('cerfa'),
    );
  }, [documents]);

  const otherDocuments = useMemo(() => {
    return documents.filter((doc) => doc.id !== cerfaDocument?.id);
  }, [documents, cerfaDocument]);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    isDirtyRef.current = true;
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  // Checklist Item 2: Strict numerical input controls for positive currency with max 2 decimals
  function handleAmountChange(rawValue: string) {
    const trimmed = rawValue.trim();
    if (trimmed === '') {
      updateField('montantDemande', '');
      return;
    }

    const normalized = trimmed.replace(',', '.');
    // Only allow positive numbers with up to 2 decimal places
    if (/^\d+(\.\d{0,2})?$/.test(normalized)) {
      updateField('montantDemande', trimmed);
    }
  }

  function handleAmountKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    // Disallow negative sign, exponential notation, etc.
    if (['-', '+', 'e', 'E'].includes(e.key)) {
      e.preventDefault();
    }
  }

  function applyDraft(draft: GrantDraft) {
    setActiveDraft(draft);
    setForm(formFromDraft(draft));
    setFieldErrors({});
    setPageError('');
    setNotice(`Brouillon « ${draft.intituleProjet || 'Sans titre'} » chargé.`);
    setShowDraftList(false);
    isDirtyRef.current = false;
  }

  function startNewDraft() {
    setActiveDraft(null);
    setForm(createEmptyForm());
    setDocuments([]);
    setFieldErrors({});
    setPageError('');
    setNotice('');
    setShowDraftList(false);
    isDirtyRef.current = false;
  }

  async function handleCerfaUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    let targetDraft = activeDraft;
    if (!targetDraft) {
      if (!form.intituleProjet.trim()) {
        setPageError('Veuillez renseigner un nom de demande avant d’ajouter un document.');
        return;
      }
      try {
        targetDraft = await createGrantDraft(toPayload(form));
        setActiveDraft(targetDraft);
        setDrafts((prev) => [targetDraft!, ...prev]);
      } catch (err) {
        setPageError(err instanceof Error ? err.message : 'Impossible d’initialiser le brouillon.');
        return;
      }
    }

    setUploadingCerfa(true);
    setPageError('');
    try {
      const doc = await uploadGrantDocument(targetDraft.id, file, 'Formulaire de subvention');
      setDocuments((prev) => [...prev.filter((d) => d.id !== cerfaDocument?.id), doc]);
      setNotice('Formulaire Cerfa téléversé avec succès.');
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'Impossible de téléverser le formulaire.');
    } finally {
      setUploadingCerfa(false);
      if (cerfaFileInputRef.current) cerfaFileInputRef.current.value = '';
    }
  }

  async function handleOtherDocumentUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    let targetDraft = activeDraft;
    if (!targetDraft) {
      if (!form.intituleProjet.trim()) {
        setPageError('Veuillez renseigner un nom de demande avant d’ajouter un document.');
        return;
      }
      try {
        targetDraft = await createGrantDraft(toPayload(form));
        setActiveDraft(targetDraft);
        setDrafts((prev) => [targetDraft!, ...prev]);
      } catch (err) {
        setPageError(err instanceof Error ? err.message : 'Impossible d’initialiser le brouillon.');
        return;
      }
    }

    setUploadingOther(true);
    setPageError('');
    try {
      const doc = await uploadGrantDocument(targetDraft.id, file, otherDocumentType);
      setDocuments((prev) => [...prev, doc]);
      setNotice(`Document « ${otherDocumentType} » ajouté avec succès.`);
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'Impossible de téléverser le document.');
    } finally {
      setUploadingOther(false);
      if (otherFileInputRef.current) otherFileInputRef.current.value = '';
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors: Record<string, string> = {};

    if (!form.intituleProjet.trim()) {
      errors.intituleProjet = 'Le nom de la demande est obligatoire.';
    }

    const cents = toCents(form.montantDemande);
    if (cents === null || cents <= 0) {
      errors.montantDemande = 'Le montant demandé doit être un montant positif à deux décimales.';
    } else if (cents > 100_000_000) {
      errors.montantDemande = 'Le montant demandé dépasse la limite autorisée de 1 000 000 €.';
    }

    if (!form.bic.trim()) {
      errors.bic = 'Le BIC est obligatoire.';
    } else if (!isValidBic(form.bic)) {
      errors.bic = 'Le BIC doit contenir 8 ou 11 caractères au format bancaire.';
    }

    if (!form.iban.trim()) {
      errors.iban = 'L’IBAN est obligatoire.';
    } else if (!isValidIban(form.iban)) {
      errors.iban = 'L’IBAN est incomplet ou invalide.';
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setPageError('Veuillez corriger les champs signalés avant d’envoyer la demande.');
      return;
    }

    setSaving(true);
    setPageError('');
    setNotice('');
    try {
      const payload = toPayload(form);
      const saved = activeDraft
        ? await updateGrantDraft(activeDraft.id, payload)
        : await createGrantDraft(payload);

      setActiveDraft(saved);
      setDrafts((prev) => [saved, ...prev.filter((d) => d.id !== saved.id)]);
      isDirtyRef.current = false;
      setNotice('Votre demande de subvention a été enregistrée et transmise.');
    } catch (error) {
      console.error('Submit error:', error);
      setPageError(error instanceof Error ? error.message : 'Une erreur est survenue lors de l’enregistrement.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-paper px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <p role="status" className="text-sm text-muted">Chargement de votre demande…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Navigation retour */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-label text-muted hover:text-ink transition-colors"
          >
            <span aria-hidden="true">←</span> RETOUR
          </button>

          {drafts.length > 0 && (
            <button
              type="button"
              onClick={() => setShowDraftList(!showDraftList)}
              className="text-xs font-bold uppercase tracking-label text-primary hover:underline"
            >
              {showDraftList ? 'Masquer mes brouillons' : `Mes brouillons (${drafts.length})`}
            </button>
          )}
        </div>

        {/* Panneau repliable des brouillons existants */}
        {showDraftList && (
          <aside aria-label="Liste des brouillons" className="mt-4 rounded-control border border-line bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-xs font-bold uppercase tracking-label text-ink">Brouillons enregistrés</h3>
              <button
                type="button"
                onClick={startNewDraft}
                className="text-xs font-bold uppercase tracking-label text-primary hover:underline"
              >
                + Nouveau formulaire
              </button>
            </div>
            <ul className="mt-3 divide-y divide-line">
              {drafts.map((d) => (
                <li key={d.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-medium text-ink">{d.intituleProjet || 'Demande sans nom'}</span>
                  <button
                    type="button"
                    onClick={() => applyDraft(d)}
                    className="text-xs font-bold uppercase tracking-label text-primary hover:underline"
                  >
                    Reprendre →
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        )}

        {/* Header de la page */}
        <header className="mt-6">
          <p className="text-label font-bold uppercase tracking-eyebrow text-primary">
            FINANCER MON PROJET
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-display text-ink sm:text-4xl lg:text-5xl">
            Demande de subvention
          </h1>
          <p className="mt-2 text-sm leading-copy text-muted sm:text-base">
            Complétez les informations et ajoutez les documents nécessaires à l’étude de votre demande.
          </p>
        </header>

        {/* Statuts d'autosave et notifications */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 min-h-6">
          {autosaveStatus === 'saving' && (
            <span role="status" className="inline-flex items-center gap-1.5 text-xs text-primary">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Enregistrement automatique en cours…
            </span>
          )}
          {autosaveStatus === 'saved' && lastSavedAt && (
            <span role="status" className="inline-flex items-center gap-1 text-xs text-moss">
              <span>✓</span> Brouillon enregistré automatiquement à {lastSavedAt}
            </span>
          )}
          {autosaveStatus === 'error' && (
            <span role="status" className="text-xs text-danger">
              Erreur d’enregistrement automatique.
            </span>
          )}
        </div>

        {pageError && (
          <p role="alert" className="mt-4 rounded-control border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
            {pageError}
          </p>
        )}
        {notice && (
          <p role="status" className="mt-4 rounded-control border border-primary/20 bg-primary/5 p-4 text-sm text-primary">
            {notice}
          </p>
        )}

        {/* Carte blanche principale du formulaire */}
        <form onSubmit={handleSubmit} className="mt-6 rounded-card border border-line/60 bg-white p-6 shadow-xs sm:p-10 space-y-10">

          {/* SECTION 1: VOTRE DEMANDE */}
          <section aria-labelledby="section-votre-demande">
            <span className="inline-flex rounded-pill bg-Misty-Rose px-3 py-1 text-caption font-bold uppercase tracking-label text-danger">
              {form.typeSubvention === 'Projet' ? 'PROJET' : 'FONCTIONNEMENT'}
            </span>
            <h2 id="section-votre-demande" className="mt-3 text-xl font-bold text-ink">
              Votre demande
            </h2>
            <p className="mt-1 text-xs text-muted">
              Donnez un nom clair à votre dossier et précisez son objet.
            </p>

            {/* Checklist Item 1: Saisie guidée de la typologie d'aide */}
            <div className="mt-6">
              <span className="block text-xs font-bold uppercase tracking-label text-ink">
                Typologie d’aide
              </span>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => updateField('typeSubvention', 'Projet')}
                  className={`flex flex-col text-left p-3.5 rounded-control transition-colors ${
                    form.typeSubvention === 'Projet'
                      ? 'bg-primary-soft/40 ring-2 ring-primary text-ink'
                      : 'bg-paper text-muted hover:text-ink'
                  }`}
                >
                  <span className="text-sm font-bold text-ink">Action ou projet ponctuel</span>
                  <span className="mt-1 text-xs">Événement, action spécifique (Rubrique N° 6 du formulaire).</span>
                </button>

                <button
                  type="button"
                  onClick={() => updateField('typeSubvention', 'Fonctionnement')}
                  className={`flex flex-col text-left p-3.5 rounded-control transition-colors ${
                    form.typeSubvention === 'Fonctionnement'
                      ? 'bg-primary-soft/40 ring-2 ring-primary text-ink'
                      : 'bg-paper text-muted hover:text-ink'
                  }`}
                >
                  <span className="text-sm font-bold text-ink">Aide au fonctionnement</span>
                  <span className="mt-1 text-xs">Financement régulier des activités courantes de l’association.</span>
                </button>
              </div>
            </div>

            {/* Champ NOM DE LA DEMANDE */}
            <div className="mt-6">
              <label htmlFor="intituleProjet" className="block text-xs font-bold uppercase tracking-label text-ink">
                NOM DE LA DEMANDE
              </label>
              <input
                id="intituleProjet"
                type="text"
                value={form.intituleProjet}
                onChange={(event) => updateField('intituleProjet', event.target.value)}
                aria-invalid={Boolean(fieldErrors.intituleProjet)}
                className={`mt-2 h-12 w-full rounded-control bg-paper px-4 text-sm text-ink outline-none transition-colors placeholder:text-muted/60 focus:ring-2 focus:ring-primary/20 ${
                  fieldErrors.intituleProjet ? 'border border-danger' : 'border border-transparent'
                }`}
                placeholder="Exemple : Festival associatif 2025"
              />
              {fieldErrors.intituleProjet && (
                <p role="alert" className="mt-1.5 text-xs text-danger">{fieldErrors.intituleProjet}</p>
              )}
            </div>

            {/* Champ MONTANT DE LA SUBVENTION avec restriction monétaire stricte (Checklist item 2) */}
            <div className="mt-6">
              <label htmlFor="montantDemande" className="block text-xs font-bold uppercase tracking-label text-ink">
                MONTANT DE LA SUBVENTION
              </label>
              <input
                id="montantDemande"
                type="text"
                inputMode="decimal"
                value={form.montantDemande}
                onChange={(event) => handleAmountChange(event.target.value)}
                onKeyDown={handleAmountKeyDown}
                aria-invalid={Boolean(fieldErrors.montantDemande)}
                className={`mt-2 h-12 w-full rounded-control bg-paper px-4 text-sm text-ink outline-none transition-colors placeholder:text-muted/60 focus:ring-2 focus:ring-primary/20 ${
                  fieldErrors.montantDemande ? 'border border-danger' : 'border border-transparent'
                }`}
                placeholder="Exemple : 2500"
              />
              {fieldErrors.montantDemande && (
                <p role="alert" className="mt-1.5 text-xs text-danger">{fieldErrors.montantDemande}</p>
              )}
            </div>

            {/* Description du projet */}
            <div className="mt-6">
              <label htmlFor="description" className="block text-xs font-bold uppercase tracking-label text-ink">
                DESCRIPTION DU PROJET OU DES OBJECTIFS
              </label>
              <textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={(event) => updateField('description', event.target.value)}
                className="mt-2 w-full rounded-control bg-paper p-4 text-sm text-ink outline-none transition-colors placeholder:text-muted/60 focus:ring-2 focus:ring-primary/20 border border-transparent resize-y"
                placeholder="Décrivez les objectifs, les actions prévues et l'utilité du financement sollicité…"
              />
            </div>

            {/* Détails complémentaires si Projet */}
            {form.typeSubvention === 'Projet' && (
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="publicCible" className="block text-xs font-bold uppercase tracking-label text-ink">
                    PUBLIC CIBLE
                  </label>
                  <input
                    id="publicCible"
                    type="text"
                    value={form.publicCible}
                    onChange={(event) => updateField('publicCible', event.target.value)}
                    className="mt-2 h-12 w-full rounded-control bg-paper px-4 text-sm text-ink outline-none transition-colors placeholder:text-muted/60 focus:ring-2 focus:ring-primary/20 border border-transparent"
                    placeholder="Exemple : Familles, jeunes…"
                  />
                </div>
                <div>
                  <label htmlFor="dateDebutProjet" className="block text-xs font-bold uppercase tracking-label text-ink">
                    DATE DE DÉBUT
                  </label>
                  <input
                    id="dateDebutProjet"
                    type="date"
                    value={form.dateDebutProjet}
                    onChange={(event) => updateField('dateDebutProjet', event.target.value)}
                    className="mt-2 h-12 w-full rounded-control bg-paper px-4 text-sm text-ink outline-none transition-colors focus:ring-2 focus:ring-primary/20 border border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="dateFinProjet" className="block text-xs font-bold uppercase tracking-label text-ink">
                    DATE DE FIN
                  </label>
                  <input
                    id="dateFinProjet"
                    type="date"
                    value={form.dateFinProjet}
                    onChange={(event) => updateField('dateFinProjet', event.target.value)}
                    className="mt-2 h-12 w-full rounded-control bg-paper px-4 text-sm text-ink outline-none transition-colors focus:ring-2 focus:ring-primary/20 border border-transparent"
                  />
                </div>
              </div>
            )}
          </section>

          {/* SECTION 2: DOCUMENTS UTILES */}
          <section aria-labelledby="section-documents-utiles">
            <span className="inline-flex rounded-pill bg-Lime-Cream px-3 py-1 text-caption font-bold uppercase tracking-label text-ink">
              RESSOURCES
            </span>
            <h2 id="section-documents-utiles" className="mt-3 text-xl font-bold text-ink">
              Documents utiles
            </h2>
            <p className="mt-1 text-xs text-muted">
              Téléchargez les modèles avant de compléter votre dossier.
            </p>

            <div className="mt-6 grid gap-4">
              <div className="flex items-center justify-between border-b border-line pb-4">
                <span className="text-sm font-semibold text-ink">Formulaire de subvention à télécharger</span>
                <a
                  href="/assets/cerfa_12156-06-1.pdf"
                  download
                  className="inline-flex h-9 items-center rounded-pill bg-black px-5 text-caption font-bold uppercase tracking-label text-white hover:opacity-90 transition-opacity"
                >
                  TÉLÉCHARGER
                </a>
              </div>
              <div className="flex items-center justify-between border-b border-line pb-4">
                <span className="text-sm font-semibold text-ink">Notice</span>
                <a
                  href="/assets/notice_5178104-1.pdf"
                  download
                  className="inline-flex h-9 items-center rounded-pill bg-black px-5 text-caption font-bold uppercase tracking-label text-white hover:opacity-90 transition-opacity"
                >
                  TÉLÉCHARGER
                </a>
              </div>
            </div>

            {/* Cadre d'instructions et Contrat d'engagement républicain demandé par l'utilisateur */}
            <div className="mt-6 rounded-soft border border-line bg-paper/60 p-5">
              <h3 className="text-sm font-bold text-ink">Avant de déposer la demande</h3>
              <div className="mt-3 grid gap-3 text-xs leading-copy text-muted">
                <p>
                  La rubrique N° 6 n’est à remplir que si vous sollicitez le financement d’une action ou d’un projet ponctuel, anciennement appelé subvention exceptionnelle.
                </p>
                <p>
                  Accompagnez votre demande d’un RIB et du rapport moral de la dernière assemblée générale. À défaut, fournissez un bilan de votre activité récente.
                </p>
                <p>
                  Pour la partie financière, vous pouvez remplacer les tableaux du dossier par vos propres tableaux de présentation pour la rubrique N° 5, Budget de l’association.
                </p>
                <p className="font-semibold text-ink">
                  Dans tous les cas, remplissez attentivement la rubrique N° 7 et signez la demande.
                </p>
              </div>

              <div className="mt-5 border-t border-line/60 pt-4">
                <h4 className="text-xs font-bold uppercase tracking-label text-ink">Contrat d’engagement républicain</h4>
                <p className="mt-1 text-xs leading-copy text-muted">
                  La loi du 24 août 2021 instaure un contrat d’engagement républicain applicable aux associations ou fondations qui demandent une subvention, un agrément ou une reconnaissance d’utilité publique.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center justify-between gap-3 rounded-control border border-line bg-white p-3">
                    <span className="text-xs font-medium text-ink">Contrat d’engagement républicain — affiche</span>
                    <a
                      href="https://www.ville-feytiat.fr/wp-content/uploads/2022/09/22-01-Contrat-Engagement-Republicain-affiche.pdf"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-8 items-center rounded-pill bg-black px-3 text-micro font-bold uppercase tracking-label text-white hover:opacity-90 transition-opacity shrink-0"
                    >
                      Télécharger
                    </a>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-control border border-line bg-white p-3">
                    <span className="text-xs font-medium text-ink">Décret n° 2021-1947 du 31 décembre 2021</span>
                    <a
                      href="https://www.ville-feytiat.fr/wp-content/uploads/2022/09/2021-12-decret-2021-1947-du-31-decembre-2021-_-contrat-dengagement-republicain.pdf"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-8 items-center rounded-pill bg-black px-3 text-micro font-bold uppercase tracking-label text-white hover:opacity-90 transition-opacity shrink-0"
                    >
                      Télécharger
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 3: PIÈCES JUSTIFICATIVES */}
          <section aria-labelledby="section-pieces-justificatives">
            <span className="inline-flex rounded-pill bg-Mint-Cream px-3 py-1 text-caption font-bold uppercase tracking-label text-primary">
              PIÈCES
            </span>
            <h2 id="section-pieces-justificatives" className="mt-3 text-xl font-bold text-ink">
              Pièces justificatives
            </h2>
            <p className="mt-1 text-xs text-muted">
              Vérifiez et complétez les documents si nécessaire.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {/* Colonne 1: FORMULAIRE DE SUBVENTION */}
              <div>
                <span className="block text-xs font-bold uppercase tracking-label text-ink">
                  FORMULAIRE DE SUBVENTION
                </span>
                <div className="mt-2 flex h-12 items-center justify-between rounded-control bg-paper px-4 text-xs">
                  <span className="truncate font-mono text-muted">
                    {cerfaDocument ? cerfaDocument.originalName : 'cerfa_12156-06.pdf'}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {cerfaDocument && (
                      <a
                        href={getMediaUrl(cerfaDocument.fichierUrl) ?? cerfaDocument.fichierUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="Consulter le document"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-control hover:bg-white text-muted hover:text-ink transition-colors"
                      >
                        <span aria-hidden="true" className="text-sm">👁</span>
                        <span className="sr-only">Voir le formulaire de subvention</span>
                      </a>
                    )}
                    <button
                      type="button"
                      disabled={uploadingCerfa}
                      onClick={() => cerfaFileInputRef.current?.click()}
                      className="inline-flex h-8 items-center rounded-control bg-Mint-Cream px-3 text-caption font-bold uppercase tracking-label text-primary hover:bg-Mint-Cream/80 transition-colors disabled:opacity-50"
                    >
                      {uploadingCerfa ? 'DÉPÔT…' : cerfaDocument ? 'REMPLACER' : 'DÉPOSER'}
                    </button>
                    <input
                      ref={cerfaFileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={handleCerfaUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Colonne 2: AUTRES DOCUMENTS */}
              <div>
                <span className="block text-xs font-bold uppercase tracking-label text-ink">
                  AUTRES DOCUMENTS
                </span>
                <div className="mt-2 flex h-12 items-center justify-between rounded-control bg-paper px-4 text-xs">
                  <select
                    value={otherDocumentType}
                    onChange={(e) => setOtherDocumentType(e.target.value)}
                    className="bg-transparent font-medium text-ink outline-none cursor-pointer flex-1 truncate pr-2"
                  >
                    <option value="Rapport moral">Rapport moral</option>
                    <option value="Bilan d’activité récente">Bilan d’activité</option>
                    <option value="Autre justificatif">Autre justificatif</option>
                  </select>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={uploadingOther}
                      onClick={() => otherFileInputRef.current?.click()}
                      className="inline-flex h-8 items-center rounded-control bg-Mint-Cream px-3 text-caption font-bold uppercase tracking-label text-primary hover:bg-Mint-Cream/80 transition-colors disabled:opacity-50"
                    >
                      {uploadingOther ? 'DÉPÔT…' : 'DÉPOSER'}
                    </button>
                    <input
                      ref={otherFileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={handleOtherDocumentUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Liste des autres documents déposés */}
            {otherDocuments.length > 0 && (
              <div className="mt-4 rounded-control border border-line bg-paper/30 p-3">
                <span className="block text-micro font-bold uppercase tracking-label text-muted">Documents complémentaires ajoutés :</span>
                <ul className="mt-2 divide-y divide-line/60">
                  {otherDocuments.map((doc) => {
                    const url = getMediaUrl(doc.fichierUrl) ?? doc.fichierUrl;
                    return (
                      <li key={doc.id} className="flex items-center justify-between py-2 text-xs">
                        <span className="truncate flex-1 pr-4">
                          <span className="font-semibold text-ink">{doc.originalName}</span>
                          <span className="ml-2 text-muted">({doc.typeDocument})</span>
                        </span>
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold uppercase tracking-label text-primary hover:underline"
                        >
                          Consulter ↗
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </section>

          {/* SECTION 4: RELEVÉ D'IDENTITÉ BANCAIRE (RIB) */}
          <section aria-labelledby="section-rib">
            <span className="inline-flex rounded-pill bg-Mint-Cream px-3 py-1 text-caption font-bold uppercase tracking-label text-primary">
              COORDONNÉES
            </span>
            <h2 id="section-rib" className="mt-3 text-xl font-bold text-ink">
              Relevé d’identité bancaire (RIB)
            </h2>
            <p className="mt-1 text-xs text-muted">
              Renseignez les coordonnées de compte de l’association.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="bic" className="block text-xs font-bold uppercase tracking-label text-ink">
                  BIC
                </label>
                <input
                  id="bic"
                  type="text"
                  value={form.bic}
                  onChange={(event) => updateField('bic', normalizeBankingCode(event.target.value))}
                  aria-invalid={Boolean(fieldErrors.bic)}
                  maxLength={11}
                  className={`mt-2 h-12 w-full rounded-control bg-paper px-4 font-mono text-sm uppercase text-ink outline-none transition-colors placeholder:text-muted/60 focus:ring-2 focus:ring-primary/20 ${
                    fieldErrors.bic ? 'border border-danger' : 'border border-transparent'
                  }`}
                  placeholder="XXXXXFRXX"
                />
                {fieldErrors.bic && (
                  <p role="alert" className="mt-1.5 text-xs text-danger">{fieldErrors.bic}</p>
                )}
              </div>

              <div>
                <label htmlFor="iban" className="block text-xs font-bold uppercase tracking-label text-ink">
                  IBAN
                </label>
                <input
                  id="iban"
                  type="text"
                  value={form.iban}
                  onChange={(event) => updateField('iban', normalizeBankingCode(event.target.value))}
                  aria-invalid={Boolean(fieldErrors.iban)}
                  maxLength={34}
                  className={`mt-2 h-12 w-full rounded-control bg-paper px-4 font-mono text-sm uppercase text-ink outline-none transition-colors placeholder:text-muted/60 focus:ring-2 focus:ring-primary/20 ${
                    fieldErrors.iban ? 'border border-danger' : 'border border-transparent'
                  }`}
                  placeholder="FRXX XXXX XXXX XXXX XXXX XXXX XXX"
                />
                {fieldErrors.iban && (
                  <p role="alert" className="mt-1.5 text-xs text-danger">{fieldErrors.iban}</p>
                )}
              </div>
            </div>
          </section>

          {/* SECTION 5: FOOTER AVEC BOUTON ENVOYER */}
          <footer className="pt-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-12 items-center justify-center rounded-control bg-primary px-8 text-xs font-bold uppercase tracking-label text-white hover:bg-primary-hover disabled:cursor-wait disabled:opacity-60 transition-colors shadow-xs shrink-0"
            >
              {saving ? 'Enregistrement…' : 'ENVOYER →'}
            </button>
            <p className="text-xs text-muted">
              En envoyant ce formulaire, vous certifiez l’exactitude des informations fournies.
            </p>
          </footer>

        </form>
      </div>
    </main>
  );
}
