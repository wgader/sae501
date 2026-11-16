import { request } from './client';
import type { MunicipalAgent } from './types';

export function getMunicipalAgents(): Promise<MunicipalAgent[]> {
  return request<MunicipalAgent[]>('/api/admin/agents');
}

export function deleteMunicipalAgent(id: number): Promise<void> {
  return request<void>(`/api/admin/agents/${id}`, { method: 'DELETE' });
}
