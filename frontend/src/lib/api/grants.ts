import { accountRequest } from './client';
import type { GrantDocument, GrantDraft, GrantDraftInput } from './types';

export function getGrantDrafts(): Promise<GrantDraft[]> {
  return accountRequest<GrantDraft[]>(
    '/api/grants/drafts',
    {},
    'Impossible de récupérer vos brouillons de subvention.',
  );
}

export function createGrantDraft(payload: GrantDraftInput): Promise<GrantDraft> {
  return accountRequest<GrantDraft>(
    '/api/grants',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    'Impossible de créer le brouillon de subvention.',
  );
}

export function updateGrantDraft(id: number, payload: GrantDraftInput): Promise<GrantDraft> {
  return accountRequest<GrantDraft>(
    `/api/grants/${id}/draft`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
    'Impossible d’enregistrer le brouillon de subvention.',
  );
}

export function validateGrantBudget(id: number): Promise<GrantDraft> {
  return accountRequest<GrantDraft>(
    `/api/grants/${id}/validate-budget`,
    { method: 'POST' },
    'Impossible de valider le budget prévisionnel.',
  );
}

export function getGrantDocuments(id: number): Promise<GrantDocument[]> {
  return accountRequest<GrantDocument[]>(
    `/api/grants/${id}/documents`,
    {},
    'Impossible de récupérer les justificatifs du dossier.',
  );
}

export function uploadGrantDocument(
  id: number,
  file: File,
  typeDocument: string,
): Promise<GrantDocument> {
  const body = new FormData();
  body.append('file', file);
  body.append('typeDocument', typeDocument);

  return accountRequest<GrantDocument>(
    `/api/grants/${id}/documents`,
    { method: 'POST', body },
    'Impossible de téléverser ce justificatif.',
  );
}
