import { ApiError, publicRequest, request } from './client';
import type {
  AdminEquipmentCategory,
  EquipmentCategory,
  EquipmentSettings,
  EquipmentSettingsInput,
  RoomSettings,
  RoomSettingsInput,
} from './types';

/** Réglages refusés par le serveur, avec le message de chaque champ. */
export function settingsFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || error.status !== 422) return {};
  const errors = (error.data as { errors?: unknown } | undefined)?.errors;
  if (!errors || typeof errors !== 'object') return {};
  return Object.fromEntries(Object.entries(errors).filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
}

export function getRoomSettings(): Promise<RoomSettings> {
  return request<RoomSettings>('/api/admin/salles/settings');
}

export function updateRoomSettings(input: RoomSettingsInput): Promise<RoomSettings> {
  return request<RoomSettings>('/api/admin/salles/settings', { method: 'PUT', body: JSON.stringify(input) });
}

export function getEquipmentSettings(): Promise<EquipmentSettings> {
  return request<EquipmentSettings>('/api/admin/equipment/settings');
}

export function updateEquipmentSettings(input: EquipmentSettingsInput): Promise<EquipmentSettings> {
  return request<EquipmentSettings>('/api/admin/equipment/settings', { method: 'PUT', body: JSON.stringify(input) });
}

/** Catégories du catalogue, pour les filtres et les libellés (associations et agents du matériel). */
export function getEquipmentCategories(): Promise<EquipmentCategory[]> {
  return publicRequest<EquipmentCategory[]>('/api/equipment/categories');
}

export function getAdminEquipmentCategories(): Promise<AdminEquipmentCategory[]> {
  return request<AdminEquipmentCategory[]>('/api/admin/equipment/categories');
}

export function createEquipmentCategory(label: string): Promise<AdminEquipmentCategory> {
  return request<AdminEquipmentCategory>('/api/admin/equipment/categories', { method: 'POST', body: JSON.stringify({ label }) });
}

export function renameEquipmentCategory(id: number, label: string): Promise<AdminEquipmentCategory> {
  return request<AdminEquipmentCategory>(`/api/admin/equipment/categories/${id}`, { method: 'PATCH', body: JSON.stringify({ label }) });
}

export function deleteEquipmentCategory(id: number): Promise<void> {
  return request<void>(`/api/admin/equipment/categories/${id}`, { method: 'DELETE' });
}
