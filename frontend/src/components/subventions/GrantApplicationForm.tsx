'use client';

import { useEffect, useState } from 'react';
import GrantDocumentsStep from '@/components/subventions/GrantDocumentsStep';
import GrantDraftList from '@/components/subventions/GrantDraftList';
import GrantPageHeader from '@/components/subventions/GrantPageHeader';
import GrantProjectStep from '@/components/subventions/GrantProjectStep';
import Notice from '@/components/ui/Notice';
import {
  createGrantDraft,
  getGrantDocuments,
  getGrantDrafts,
  type GrantDocument,
  type GrantDraft,
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

export default function GrantApplicationForm() {
  const [drafts, setDrafts] = useState<GrantDraft[]>([]);
  const [activeDraft, setActiveDraft] = useState<GrantDraft | null>(null);
  const [form, setForm] = useState<GrantFormState>(createEmptyGrantForm);
  const [step, setStep] = useState<Step>('project');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pageError, setPageError] = useState('');
  const [documentError, setDocumentError] = useState('');
  const [notice, setNotice] = useState('');
  const [fieldErrors, setFieldErrors] = useState<GrantFormErrors>({});
  const [documents, setDocuments] = useState<GrantDocument[]>([]);

  useEffect(() => {
    let isActive = true;
    getGrantDrafts()
      .then((items) => {
        if (isActive) setDrafts(items);
      })
      .catch((error: unknown) => {
        if (isActive) setPageError(errorMessage(error, 'Impossible de charger vos brouillons.'));
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
      setActiveDraft(saved);
      setDrafts((current) => [saved, ...current.filter((draft) => draft.id !== saved.id)]);
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

  const updateField = (field: keyof GrantFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };

  const backToDrafts = () => {
    clearMessages();
    setActiveDraft(null);
    setForm(createEmptyGrantForm());
    setStep('project');
    setDocuments([]);
  };

  return (
    <main className="min-h-screen bg-white px-6 py-8 sm:px-10 lg:px-14 lg:py-10">
      <div className="mx-auto max-w-328">
        <GrantPageHeader
          title={activeDraft ? 'Demande de subvention' : 'Demandes de subvention'}
          description={
            activeDraft
              ? 'Complétez les informations de votre dossier pour la mairie.'
              : 'Préparez une demande d’aide au fonctionnement ou le financement d’un projet.'
          }
        />

        {pageError && <Notice tone="danger" className="mt-6">{pageError}</Notice>}
        {notice && <Notice tone="success" className="mt-6">{notice}</Notice>}

        {isLoading && <p role="status" className="py-12 text-center text-sm text-muted">Chargement de vos brouillons…</p>}

        {!isLoading && !activeDraft && (
          <GrantDraftList drafts={drafts} isCreating={isSaving} onCreate={() => void createDraft()} onSelect={openDraft} />
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
            onUpload={uploadDocument}
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
