import { request } from './client';
import type {
  AdminAgent,
  AdminAgentsResponse,
  AdminAgentPayload,
  AssociationRequestDetail,
  AssociationRequestsResponse,
} from './types';
import type { ExternalEvent } from './evenements';

export function getAdminAgents(): Promise<AdminAgentsResponse> {
  return request<AdminAgentsResponse>('/api/admin/agents?page=1&itemsPerPage=50');
}

export function createAdminAgent(payload: AdminAgentPayload): Promise<AdminAgent> {
  return request<AdminAgent>('/api/admin/agents', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateAdminAgent(
  id: number,
  payload: Partial<AdminAgentPayload>,
): Promise<AdminAgent> {
  return request<AdminAgent>(`/api/admin/agents/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteAdminAgent(id: number): Promise<void> {
  return request<void>(`/api/admin/agents/${id}`, { method: 'DELETE' });
}

export function getAdminAssociationRequests(id: number): Promise<AssociationRequestsResponse> {
  return request<AssociationRequestsResponse>(`/api/admin/associations/${id}/requests`);
}

export function getAdminAssociationEvents(id: number): Promise<{ items: ExternalEvent[] }> {
  return request<{ items: ExternalEvent[] }>(`/api/admin/associations/${id}/events`);
}

export function getAdminAssociationRequestDetail(
  associationId: number,
  requestId: string,
  type?: string,
): Promise<AssociationRequestDetail> {
  const query = type ? `?type=${encodeURIComponent(type)}` : '';
  return request<AssociationRequestDetail>(
    `/api/admin/associations/${associationId}/requests/${encodeURIComponent(requestId)}${query}`,
  );
}

export function requestAdminAssociationDocuments(
  associationId: number,
  requestId: string,
  type: 'materiel' | 'salle',
  missingFiles: string[],
  message: string,
): Promise<{ message: string; missingFiles: string[]; detail: AssociationRequestDetail }> {
  return request<{ message: string; missingFiles: string[]; detail: AssociationRequestDetail }>(
    `/api/admin/associations/${associationId}/requests/${encodeURIComponent(requestId)}/request-documents`,
    {
      method: 'POST',
      body: JSON.stringify({ type, missingFiles, message }),
    },
  );
}
