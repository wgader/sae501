import { accountRequest, ApiError, apiFetch, request } from './client';
import type {
  AdminCampaignWishes,
  CampaignWishError,
  CampaignWishInput,
  CampaignWishSubmission,
  MyCampaignWishesResponse,
} from './types';

export function getMyCampaignWishes(): Promise<MyCampaignWishesResponse> {
  return accountRequest<MyCampaignWishesResponse>('/api/campaigns/current/wishes', {}, 'Impossible de charger vos vœux.');
}

/** Refus du serveur : campagne fermée entre-temps, ou lignes invalides (avec la ligne et le champ). */
export class CampaignWishSubmitError extends ApiError {
  constructor(message: string, status: number, public readonly closed: boolean, public readonly errors: CampaignWishError[]) {
    super(message, status);
  }
}

export async function submitCampaignWishes(wishes: CampaignWishInput[]): Promise<CampaignWishSubmission> {
  const response = await apiFetch('/api/campaigns/current/wishes', { method: 'POST', body: JSON.stringify({ wishes }) });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new CampaignWishSubmitError(
      typeof data?.message === 'string' ? data.message : 'Impossible de transmettre vos vœux.',
      response.status,
      data?.code === 'CAMPAIGN_CLOSED',
      Array.isArray(data?.errors) ? data.errors : [],
    );
  }
  return data as CampaignWishSubmission;
}

export function getAdminCampaignWishes(campaignId: number): Promise<AdminCampaignWishes> {
  return request<AdminCampaignWishes>(`/api/admin/campaign-wishes/campaigns/${campaignId}`);
}

export function acceptCampaignWish(id: number, refuseOthers: boolean): Promise<{ accepted: number; refused: number[] }> {
  return request(`/api/admin/campaign-wishes/${id}/accept`, { method: 'POST', body: JSON.stringify({ refuseOthers }) });
}

export function refuseCampaignWish(id: number, comment: string): Promise<{ refused: number[] }> {
  return request(`/api/admin/campaign-wishes/${id}/refuse`, { method: 'POST', body: JSON.stringify({ comment }) });
}

export function resetCampaignWish(id: number): Promise<{ pending: number[] }> {
  return request(`/api/admin/campaign-wishes/${id}/reset`, { method: 'POST' });
}
