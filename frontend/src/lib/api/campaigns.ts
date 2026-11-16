import { request, accountRequest, ApiError } from './client';
import type {
  Campaign,
  CampaignCurrentResponse,
  CampaignRequest,
  CampaignRequestsResponse,
} from './types';

export interface CreateCampaignPayload {
  seasonLabel: string;
  openingAt: string;
  closingAt: string;
  resourceTypes: string[];
}

/**
 * Récupère l'ensemble des campagnes (admin).
 */
export async function getAdminCampaigns(): Promise<Campaign[]> {
  const data = await request<Campaign[] | { 'hydra:member'?: Campaign[] }>('/api/admin/campaigns');
  if (Array.isArray(data)) {
    return data;
  }
  if (data && Array.isArray(data['hydra:member'])) {
    return data['hydra:member'];
  }
  return [];
}

/**
 * Crée une nouvelle campagne (statut PROGRAMMED par défaut).
 */
export async function createCampaign(payload: CreateCampaignPayload): Promise<Campaign> {
  return request<Campaign>('/api/admin/campaigns', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Ouvre manuellement une campagne programmée (passe au statut ACTIVE).
 */
export async function openCampaign(id: number): Promise<Campaign> {
  return request<Campaign>(`/api/admin/campaigns/${id}/open`, {
    method: 'POST',
  });
}

/**
 * Clôture manuellement une campagne active (passe au statut CLOSED).
 */
export async function closeCampaign(id: number): Promise<Campaign> {
  return request<Campaign>(`/api/admin/campaigns/${id}/close`, {
    method: 'POST',
  });
}

/**
 * Récupère l'état de la campagne courante (accessible usager / association).
 */
export async function getCurrentCampaign(): Promise<CampaignCurrentResponse> {
  try {
    return await accountRequest<CampaignCurrentResponse>('/api/campaigns/current');
  } catch (error: unknown) {
    if (error instanceof ApiError && error.status === 404) {
      return { active: false, campaign: null };
    }
    throw error;
  }
}

/** Créneau proposé par la mairie (déplacement ou ajout), en heures locales. */
export interface CampaignSlotPayload {
  salleId: number;
  dateDebut: string;
  dateFin: string;
}

export interface AddCampaignSlotPayload extends CampaignSlotPayload {
  associationId: number;
  motifEvenement: string;
}

/**
 * Avance ou repousse l'ouverture et la clôture d'une campagne ; le statut suit les dates.
 */
export function rescheduleCampaign(id: number, openingAt: string, closingAt: string): Promise<Campaign> {
  return request<Campaign>(`/api/admin/campaigns/${id}/schedule`, {
    method: 'PATCH',
    body: JSON.stringify({ openingAt, closingAt }),
  });
}

export function getCampaignRequests(id: number): Promise<CampaignRequestsResponse> {
  return request<CampaignRequestsResponse>(`/api/admin/campaigns/${id}/requests`);
}

export function acceptCampaignRequest(campaignId: number, requestId: number): Promise<CampaignRequest> {
  return request<CampaignRequest>(`/api/admin/campaigns/${campaignId}/requests/${requestId}/accept`, {
    method: 'POST',
  });
}

export function refuseCampaignRequest(
  campaignId: number,
  requestId: number,
  reason: string,
): Promise<CampaignRequest> {
  return request<CampaignRequest>(`/api/admin/campaigns/${campaignId}/requests/${requestId}/refuse`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export function rescheduleCampaignRequest(
  campaignId: number,
  requestId: number,
  payload: CampaignSlotPayload & { reason: string },
): Promise<CampaignRequest> {
  return request<CampaignRequest>(`/api/admin/campaigns/${campaignId}/requests/${requestId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function addCampaignSlot(campaignId: number, payload: AddCampaignSlotPayload): Promise<CampaignRequest> {
  return request<CampaignRequest>(`/api/admin/campaigns/${campaignId}/requests`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
