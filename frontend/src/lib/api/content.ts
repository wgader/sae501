import { publicRequest, request } from './client';
import type {
  FaqItem,
  GrantDocumentType,
  GrantResource,
  LegalContent,
} from './types';

// --- Contenu Public ---

export function getPublicFaq(): Promise<FaqItem[]> {
  return publicRequest<FaqItem[]>('/api/public/faq');
}

export function getPublicLegal(type: 'cgu' | 'mentions_legales'): Promise<LegalContent> {
  return publicRequest<LegalContent>(`/api/public/legal/${type}`);
}

export function getPublicGrantResources(): Promise<GrantResource[]> {
  return publicRequest<GrantResource[]>('/api/public/grants/resources');
}

export function getPublicGrantDocumentTypes(): Promise<GrantDocumentType[]> {
  return publicRequest<GrantDocumentType[]>('/api/public/grants/document-types');
}

// --- Administration FAQ ---

export function getAdminFaq(): Promise<FaqItem[]> {
  return request<FaqItem[]>('/api/admin/content/faq');
}

export function createAdminFaq(input: { question: string; answer: string; displayOrder?: number }): Promise<FaqItem> {
  return request<FaqItem>('/api/admin/content/faq', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateAdminFaq(
  id: number,
  input: { question?: string; answer?: string; displayOrder?: number }
): Promise<FaqItem> {
  return request<FaqItem>(`/api/admin/content/faq/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function deleteAdminFaq(id: number): Promise<void> {
  return request<void>(`/api/admin/content/faq/${id}`, { method: 'DELETE' });
}

// --- Administration Légal / CGU ---

export function getAdminLegal(type: 'cgu' | 'mentions_legales'): Promise<LegalContent> {
  return request<LegalContent>(`/api/admin/content/legal/${type}`);
}

export function updateAdminLegal(
  type: 'cgu' | 'mentions_legales',
  input: { title?: string; subtitle?: string | null; lastUpdated?: string | null; sections?: { title: string; text: string }[] }
): Promise<LegalContent> {
  return request<LegalContent>(`/api/admin/content/legal/${type}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

// --- Administration Subvention : Types de documents requis ---

export function getAdminGrantDocumentTypes(): Promise<GrantDocumentType[]> {
  return request<GrantDocumentType[]>('/api/admin/content/grants/document-types');
}

export function createAdminGrantDocumentType(input: {
  label: string;
  isRequired?: boolean;
  displayOrder?: number;
}): Promise<GrantDocumentType> {
  return request<GrantDocumentType>('/api/admin/content/grants/document-types', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateAdminGrantDocumentType(
  id: number,
  input: { label?: string; isRequired?: boolean; displayOrder?: number }
): Promise<GrantDocumentType> {
  return request<GrantDocumentType>(`/api/admin/content/grants/document-types/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function deleteAdminGrantDocumentType(id: number): Promise<void> {
  return request<void>(`/api/admin/content/grants/document-types/${id}`, { method: 'DELETE' });
}

// --- Administration Subvention : Fichiers modèles et ressources ---

export function getAdminGrantResources(): Promise<GrantResource[]> {
  return request<GrantResource[]>('/api/admin/content/grants/resources');
}

export function createAdminGrantResource(input: {
  label: string;
  url: string;
  isExternal?: boolean;
  displayOrder?: number;
}): Promise<GrantResource> {
  return request<GrantResource>('/api/admin/content/grants/resources', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateAdminGrantResource(
  id: number,
  input: { label?: string; url?: string; isExternal?: boolean; displayOrder?: number }
): Promise<GrantResource> {
  return request<GrantResource>(`/api/admin/content/grants/resources/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function deleteAdminGrantResource(id: number): Promise<void> {
  return request<void>(`/api/admin/content/grants/resources/${id}`, { method: 'DELETE' });
}
