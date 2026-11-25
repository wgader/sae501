'use client';

import { useEffect, useRef, useState } from 'react';
import { updateGrantDraft, type GrantDraft } from '@/lib/api';
import { grantPayloadFromForm, type GrantFormState } from '@/lib/grantApplication';
import { logger } from '@/lib/logger';

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/** Délai sans frappe avant l’enregistrement automatique du brouillon. */
const AUTOSAVE_DELAY_MS = 2000;

interface UseGrantAutosaveOptions {
  draftId: number | null;
  form: GrantFormState;
  /** Vrai seulement après une saisie de l’utilisateur : ouvrir un brouillon ne déclenche rien. */
  isDirty: boolean;
  onSaved: (draft: GrantDraft) => void;
}

/**
 * Enregistre le brouillon ouvert deux secondes après la dernière saisie
 * (reprise du travail de Vivien Pain sur feature/form-subvention).
 */
export function useGrantAutosave({ draftId, form, isDirty, onSaved }: UseGrantAutosaveOptions) {
  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  // Le dernier rappel est lu au moment de l’enregistrement, sans relancer le minuteur.
  const onSavedRef = useRef(onSaved);

  useEffect(() => {
    onSavedRef.current = onSaved;
  }, [onSaved]);

  useEffect(() => {
    if (draftId === null || !isDirty) return;

    let isActive = true;
    const timer = window.setTimeout(() => {
      setStatus('saving');
      updateGrantDraft(draftId, grantPayloadFromForm(form))
        .then((saved) => {
          if (!isActive) return;
          onSavedRef.current(saved);
          setSavedAt(new Date());
          setStatus('saved');
        })
        .catch((error: unknown) => {
          logger.error('Enregistrement automatique du brouillon impossible', error);
          if (isActive) setStatus('error');
        });
    }, AUTOSAVE_DELAY_MS);

    return () => {
      isActive = false;
      window.clearTimeout(timer);
    };
  }, [draftId, form, isDirty]);

  return { status, savedAt };
}
