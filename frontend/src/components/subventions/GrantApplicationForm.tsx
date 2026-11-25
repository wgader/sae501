'use client';

import { useCallback, useEffect, useState } from 'react';
import GrantAutosaveStatus from '@/components/subventions/GrantAutosaveStatus';
import GrantDocumentsStep from '@/components/subventions/GrantDocumentsStep';
import GrantDraftList from '@/components/subventions/GrantDraftList';
import ModulePageHeader from '@/components/ui/ModulePageHeader';
import { GRANT_STEPS } from '@/lib/moduleGuides';
import GrantProjectStep from '@/components/subventions/GrantProjectStep';
import GrantSubmittedList from '@/components/subventions/GrantSubmittedList';
import Notice from '@/components/ui/Notice';
import { useGrantAutosave } from '@/hooks/useGrantAutosave';
import {
  createGrantDraft,
  getGrantDocuments,
  getGrantDrafts,
  getSubmittedGrants,
  submitGrant,
  type GrantDocument,
  type GrantDraft,
  type SubmittedGrant,
  updateGrantDraft,
  uploadGrantDocument,
} from '@/lib/api';
import {
  createEmptyGrantForm,
  grantFormFromDraft,
  grantPayloadFromForm,
  validateGrantForm,
  type GrantFormErrors,
  type GrantFormState,
} from '@/lib/grantApplication';

type Step = 'project' | 'documents';

const errorMessage = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback);

/** Montant en euros, positif, deux décimales au plus : la saisie refuse tout autre caractère. */
const AMOUNT_INPUT = /^\d*(?:[.,]\d{0,2})?$/;

export default function GrantApplicationForm() {
  const [drafts, setDrafts] = useState<GrantDraft[]>([]);
  const [submitted, setSubmitted] = useState<SubmittedGrant[]>([]);
  const [activeDraft, setActiveDraft] = useState<GrantDraft | null>(null);
  const [form, setForm] = useState<GrantFormState>(createEmptyGrantForm);
  const [step, setStep] = useState<Step>('project');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageError, setPageError] = useState('');
  const [documentError, setDocumentError] = useState('');
  const [notice, setNotice] = useState('');
  const [fieldErrors, setFieldErrors] = useState<GrantFormErrors>({});
  const [documents, setDocuments] = useState<GrantDocument[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  const keepSavedDraft = useCallback((saved: GrantDraft) => {
    setActiveDraft(saved);
    setDrafts((current) => [saved, ...current.filter((draft) => draft.id !== saved.id)]);
    setIsDirty(false);
  }, []);
  const autosave = useGrantAutosave({
    draftId: step === 'project' ? (activeDraft?.id ?? null) : null,
    form,
    isDirty,
    onSaved: keepSavedDraft,
  });

  useEffect(() => {
    let isActive = true;
    Promise.all([getGrantDrafts(), getSubmittedGrants()])
      .then(([draftItems, submittedItems]) => {
        if (!isActive) return;
        setDrafts(draftItems);
        setSubmitted(submittedItems);
      })
      .catch((error: unknown) => {
        if (isActive) setPageError(errorMessage(error, 'Impossible de charger vos demandes.'));
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const activeDraftId = activeDraft?.id;
  useEffect(() => {
    if (activeDraftId === undefined) return;

    let isActive = true;
    getGrantDocuments(activeDraftId)
      .then((items) => {
        if (isActive) setDocuments(items);
      })
      .catch((error: unknown) => {
        if (isActive) setDocumentError(errorMessage(error, 'Impossible de charger les justificatifs.'));
      });

    return () => {
      isActive = false;
    };
  }, [activeDraftId]);

  const clearMessages = () => {
    setPageError('');
    setDocumentError('');
    setNotice('');
    setFieldErrors({});
  };

  const openDraft = (draft: GrantDraft) => {
    clearMessages();
    setActiveDraft(draft);
    setForm(grantFormFromDraft(draft));
    setStep(draft.budgetValide ? 'documents' : 'project');
    setDocuments([]);
    setIsDirty(false);
  };

  const createDraft = async () => {
    setIsSaving(true);
    clearMessages();
    try {
      const draft = await createGrantDraft(grantPayloadFromForm(createEmptyGrantForm()));
      setDrafts((current) => [draft, ...current]);
      openDraft(draft);
    } catch (error: unknown) {
      setPageError(errorMessage(error, 'Impossible de créer le brouillon.'));
    } finally {
      setIsSaving(false);
    }
  };

  const saveDraft = async (successMessage: string): Promise<boolean> => {
    if (!activeDraft) return false;
    setIsSaving(true);
    setPageError('');
    setNotice('');
    try {
      const saved = await updateGrantDraft(activeDraft.id, grantPayloadFromForm(form));
      keepSavedDraft(saved);
      setNotice(successMessage);
      return true;
    } catch (error: unknown) {
      setPageError(errorMessage(error, 'Impossible d’enregistrer le brouillon.'));
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const continueToDocuments = async () => {
    const errors = validateGrantForm(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    if (await saveDraft('Votre demande est enregistrée. Ajoutez maintenant vos pièces justificatives.')) setStep('documents');
  };

  const uploadDocument = async (file: File, documentType: string): Promise<boolean> => {
    if (!activeDraft) return false;
    setIsUploading(true);
    setDocumentError('');
    try {
      const document = await uploadGrantDocument(activeDraft.id, file, documentType);
      setDocuments((current) => [...current, document]);
      setNotice('Le justificatif a été ajouté.');
      return true;
    } catch (error: unknown) {
      setDocumentError(errorMessage(error, 'Impossible d’ajouter ce justificatif.'));
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  const submitDraft = async () => {
    if (!activeDraft) return;
    setIsSubmitting(true);
    clearMessages();
    try {
      const sent = await submitGrant(activeDraft.id);
      setDrafts((current) => current.filter((draft) => draft.id !== sent.id));
      setSubmitted((current) => [sent, ...current]);
      backToDrafts();
      setNotice('Votre dossier a été transmis à la mairie. Il est maintenant en attente de décision.');
    } catch (error: unknown) {
      setPageError(errorMessage(error, 'Impossible de transmettre le dossier.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof GrantFormState, value: string) => {
    if (field === 'montantDemande' && !AMOUNT_INPUT.test(value.trim())) return;
    setIsDirty(true);
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };

  const backToDrafts = () => {
    clearMessages();
    setActiveDraft(null);
    setForm(createEmptyGrantForm());
    setStep('project');
    setDocuments([]);
    setIsDirty(false);
  };

  return (
    <main className="min-h-screen bg-white px-6 py-8 sm:px-10 lg:px-14 lg:py-10">
      <div className="mx-auto max-w-328">
        <ModulePageHeader
          module="grants"
          title={activeDraft ? 'Demande de subvention' : 'Demandes de subvention'}
          lead={
            activeDraft
              ? 'Complétez votre dossier étape par étape : vous pouvez le quitter et le reprendre, il reste en brouillon jusqu’à l’envoi.'
              : 'Sollicitez une aide de la mairie pour le fonctionnement de votre association ou pour financer un projet.'
          }
          steps={GRANT_STEPS}
        />

        {pageError && <Notice tone="danger" className="mt-6">{pageError}</Notice>}
        {notice && <Notice tone="success" className="mt-6">{notice}</Notice>}
        {activeDraft && step === 'project' && <GrantAutosaveStatus status={autosave.status} savedAt={autosave.savedAt} />}

        {isLoading && <p role="status" className="py-12 text-center text-sm text-muted">Chargement de vos demandes…</p>}

        {!isLoading && !activeDraft && (
          <>
            <GrantDraftList drafts={drafts} isCreating={isSaving} onCreate={() => void createDraft()} onSelect={openDraft} />
            <GrantSubmittedList grants={submitted} />
          </>
        )}

        {activeDraft && step === 'project' && (
          <GrantProjectStep
            form={form}
            errors={fieldErrors}
            isSaving={isSaving}
            onChange={updateField}
            onSaveDraft={() => void saveDraft('Votre brouillon a été enregistré.')}
            onContinue={() => void continueToDocuments()}
            onBack={backToDrafts}
          />
        )}

        {activeDraft && step === 'documents' && (
          <GrantDocumentsStep
            form={form}
            documents={documents}
            error={documentError}
            isUploading={isUploading}
            isSubmitting={isSubmitting}
            onUpload={uploadDocument}
            onSubmit={() => void submitDraft()}
            onEdit={() => {
              setNotice('');
              setStep('project');
            }}
            onBack={backToDrafts}
          />
        )}
      </div>
    </main>
  );
}
