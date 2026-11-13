import { request, accountRequest } from './client';
import type { Campaign, CampaignCurrentResponse } from './types';

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
  } catch {
    return { active: false, campaign: null };
  }
}

