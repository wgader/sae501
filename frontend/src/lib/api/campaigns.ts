import { request, accountRequest, ApiError, downloadPrivateDocument } from './client';
import type {
  Campaign,
  CampaignCurrentResponse,
  CampaignRequest,
  CampaignRequestsResponse,
  CampaignWithTotals,
  MyCampaignRequestsResponse,
  RoomRequestsResponse,
} from './types';

/** Jours réservables de la campagne (AAAA-MM-JJ). */
export interface CampaignPeriod {
  periodStart: string | null;
  periodEnd: string | null;
}

export interface CreateCampaignPayload extends CampaignPeriod {
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

/** Toutes les campagnes avec leur bilan, la plus récente d'abord. */
export function getCampaignHistory(): Promise<CampaignWithTotals[]> {
  return request<CampaignWithTotals[]>('/api/admin/campaign-history');
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
 * Rouvre une campagne clôturée par erreur ; ses demandes sont conservées.
 */
export function reopenCampaign(id: number, closingAt: string): Promise<Campaign> {
  return request<Campaign>(`/api/admin/campaigns/${id}/reopen`, {
    method: 'POST',
    body: JSON.stringify({ closingAt }),
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

export interface CampaignSchedulePayload extends CampaignPeriod {
  openingAt: string;
  closingAt: string;
}

/**
 * Modifie les dates de dépôt et la période réservable ; le statut suit les dates.
 */
export function rescheduleCampaign(id: number, payload: CampaignSchedulePayload): Promise<Campaign> {
  return request<Campaign>(`/api/admin/campaigns/${id}/schedule`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/** Annulation d'une demande par la mairie, possible même après la clôture. */
export function cancelCampaignRequest(campaignId: number, requestId: number, reason: string): Promise<CampaignRequest> {
  return request<CampaignRequest>(`/api/admin/campaigns/${campaignId}/requests/${requestId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

/** Prévient toutes les associations en concurrence sur le créneau de cette demande. */
export function notifyCampaignConflict(campaignId: number, requestId: number): Promise<{ notified: number }> {
  return request<{ notified: number }>(`/api/admin/campaigns/${campaignId}/requests/${requestId}/notify-conflict`, {
    method: 'POST',
  });
}

/** Demandes de l'association connectée pour la campagne en cours ou la dernière clôturée. */
export function getMyCampaignRequests(): Promise<MyCampaignRequestsResponse> {
  return accountRequest<MyCampaignRequestsResponse>(
    '/api/campaigns/current/requests',
    {},
    'Impossible de charger vos demandes de campagne.',
  );
}

/** Réservations ponctuelles (hors campagne) à traiter par la mairie. */
export function getRoomRequests(): Promise<RoomRequestsResponse> {
  return request<RoomRequestsResponse>('/api/admin/room-requests');
}

export function acceptRoomRequest(requestId: number): Promise<CampaignRequest> {
  return request<CampaignRequest>(`/api/admin/room-requests/${requestId}/accept`, { method: 'POST' });
}

export function refuseRoomRequest(requestId: number, reason: string): Promise<CampaignRequest> {
  return request<CampaignRequest>(`/api/admin/room-requests/${requestId}/refuse`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export function cancelRoomRequest(requestId: number, reason: string): Promise<CampaignRequest> {
  return request<CampaignRequest>(`/api/admin/room-requests/${requestId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
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

export type CampaignPlanningView = 'complet' | 'general' | 'salle' | 'association';

export interface CampaignPlanningExportOptions {
  view: CampaignPlanningView;
  /** Jours inclus au format AAAA-MM-JJ ; sans période, toute la campagne est exportée. */
  from?: string;
  to?: string;
  includeRefused: boolean;
}

/** Télécharge le planning PDF des demandes de salle d'une campagne. */
export function downloadCampaignPlanning(
  campaign: Campaign,
  { view, from, to, includeRefused }: CampaignPlanningExportOptions,
): Promise<void> {
  const params = new URLSearchParams({ view });
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  if (includeRefused) params.set('refused', '1');

  return downloadPrivateDocument(
    `/api/admin/campaigns/${campaign.id}/planning.pdf?${params.toString()}`,
    `planning-salles-${campaign.seasonLabel.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${view}.pdf`,
  );
}
