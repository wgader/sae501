import { request } from './client';
import type { Salle } from './types';

export type CreateSalleInput = {
  nom: string;
  adresse: string;
  description?: string;
  capaciteMax: number;
  accesPmr: boolean;
  equipementsInclus: string[];
  image?: File;
};

export function createSalle(input: CreateSalleInput): Promise<Salle> {
  const body = new FormData();
  body.append('nom', input.nom);
  body.append('adresse', input.adresse);
  body.append('description', input.description || '');
  body.append('capaciteMax', String(input.capaciteMax));
  body.append('accesPmr', String(input.accesPmr));
  body.append('equipementsInclus', JSON.stringify(input.equipementsInclus));
  if (input.image) body.append('image', input.image);

  return request<Salle>('/api/admin/salles', {
    method: 'POST',
    body,
  });
}

export function getSalles(): Promise<Salle[]> {
  return request<Salle[]>('/api/admin/salles');
}

export function updateSalle(id: number, input: Partial<CreateSalleInput>): Promise<Salle> {
  if (input.image) {
    const body = new FormData();
    Object.entries(input).forEach(([key, value]) => {
      if (key === 'image' && value instanceof File) body.append(key, value);
      else if (Array.isArray(value)) body.append(key, JSON.stringify(value));
      else if (value !== undefined) body.append(key, String(value));
    });

    return request<Salle>(`/api/admin/salles/${id}`, {
      method: 'POST',
      body,
    });
  }

  return request<Salle>(`/api/admin/salles/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export function updateSalleStatus(id: number, isActive: boolean): Promise<Salle> {
  return request<Salle>(`/api/admin/salles/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isActive }),
  });
}

export function archiveSalle(id: number): Promise<Salle> {
  return request<Salle>(`/api/admin/salles/${id}`, {
    method: 'DELETE',
  });
}
