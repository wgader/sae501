import { request } from './client';
import type {
  Association,
  AssociationDocument,
  AssociationModule,
  AssociationPage,
  AssociationStatus,
} from './types';

export function getAssociations(
  page: number,
  status: AssociationStatus | '',
  search?: string,
  includeCounts?: boolean,
  itemsPerPage: number = 10,
): Promise<AssociationPage> {
  const params = new URLSearchParams({ page: String(page), itemsPerPage: String(itemsPerPage) });
  if (status) params.set('status', status);
  if (search) params.set('q', search);
  if (includeCounts !== undefined) params.set('includeCounts', String(includeCounts));
  return request<AssociationPage>(`/api/admin/associations?${params.toString()}`);
}

export function getAssociation(id: number): Promise<Association> {
  return request<Association>(`/api/admin/associations/${id}`);
}

export function updateAssociationStatus(
  id: number,
  status: AssociationStatus,
  permissions?: AssociationModule[],
): Promise<Association> {
  const body: { status: AssociationStatus; permissions?: AssociationModule[] } = { status };
  if (permissions !== undefined) {
    body.permissions = permissions;
  }
  return request<Association>(`/api/admin/associations/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}
export function updateAssociationModules(
  id: number,
  permissions: AssociationModule[],
): Promise<Association> {
  return request<Association>(`/api/admin/associations/${id}/modules`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ permissions }),
  });
}

export function deleteAssociation(id: number): Promise<void> {
  return request<void>(`/api/admin/associations/${id}`, {
    method: 'DELETE',
  });
}
export function uploadAssociationDocument(
  associationId: number,
  file: File,
  typeDocument?: string,
  isVerified?: boolean,
): Promise<AssociationDocument> {
  const body = new FormData();
  body.append('file', file);
  if (typeDocument) body.append('typeDocument', typeDocument);
  if (isVerified !== undefined) body.append('isVerified', String(isVerified));

  return request<AssociationDocument>(`/api/admin/associations/${associationId}/documents`, {
    method: 'POST',
    body,
  });
}

export function updateAssociationDocument(
  associationId: number,
  docId: number,
  data: { typeDocument?: string; isVerified?: boolean },
): Promise<AssociationDocument> {
  return request<AssociationDocument>(`/api/admin/associations/${associationId}/documents/${docId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function deleteAssociationDocument(
  associationId: number,
  docId: number,
): Promise<void> {
  return request<void>(`/api/admin/associations/${associationId}/documents/${docId}`, {
    method: 'DELETE',
  });
}
