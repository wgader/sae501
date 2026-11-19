import { accountRequest, request } from './client';
import type {
  AdminGrantDecision,
  AdminGrantDetail,
  AdminGrantFilter,
  AdminGrantList,
  GrantDocument,
  GrantDraft,
  GrantDraftInput,
  SubmittedGrant,
} from './types';

/** Dossiers déjà transmis à la mairie par l'association connectée. */
export function getSubmittedGrants(): Promise<SubmittedGrant[]> {
  return accountRequest<SubmittedGrant[]>(
    '/api/grants',
    {},
    'Impossible de récupérer vos demandes transmises.',
  );
}

export function submitGrant(id: number): Promise<SubmittedGrant> {
  return accountRequest<SubmittedGrant>(
    `/api/grants/${id}/submit`,
    { method: 'POST' },
    'Impossible de transmettre le dossier à la mairie.',
  );
}

export function getAdminGrants(filter: AdminGrantFilter): Promise<AdminGrantList> {
  return request<AdminGrantList>(`/api/admin/grants?status=${filter}`);
}

export function getAdminGrant(id: number): Promise<AdminGrantDetail> {
  return request<AdminGrantDetail>(`/api/admin/grants/${id}`);
}

export function decideAdminGrant(id: number, decision: AdminGrantDecision): Promise<AdminGrantDetail> {
  return request<AdminGrantDetail>(`/api/admin/grants/${id}/decision`, {
    method: 'PATCH',
    body: JSON.stringify(decision),
  });
}

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
