import { accountRequest, request, ApiError, API_URL } from './client';
import type {
  AdminEquipmentReservation,
  AdminEquipmentReservationPage,
  Equipment,
  EquipmentAvailabilityResponse,
  EquipmentReservation,
  EquipmentReservationInput,
  StockAdjustment,
  StockCheckResult,
} from './types';

export function getEquipmentAvailability(
  start: string,
  end: string,
): Promise<EquipmentAvailabilityResponse> {
  const params = new URLSearchParams({ start, end });
  return accountRequest<EquipmentAvailabilityResponse>(`/api/equipment/availability?${params.toString()}`);
}

export function createEquipmentReservation(
  payload: EquipmentReservationInput,
): Promise<EquipmentReservation> {
  return accountRequest<EquipmentReservation>('/api/equipment/reservations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
export function getAdminEquipment(category?: string, archived?: boolean): Promise<Equipment[]> {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (archived !== undefined) params.set('archived', String(archived));
  const query = params.toString() ? `?${params.toString()}` : '';
  return request<Equipment[]>(`/api/admin/equipment${query}`);
}

export function getAdminEquipmentReservations(
  page: number,
  status: AdminEquipmentReservation['statut'] | '',
  search?: string,
  itemsPerPage = 10,
): Promise<AdminEquipmentReservationPage> {
  const params = new URLSearchParams({
    page: String(page),
    itemsPerPage: String(itemsPerPage),
  });
  if (status) params.set('status', status);
  if (search) params.set('q', search);
  return request<AdminEquipmentReservationPage>(`/api/admin/equipment/reservations?${params.toString()}`);
}

export function getAdminEquipmentReservation(id: number): Promise<AdminEquipmentReservation> {
  return request<AdminEquipmentReservation>(`/api/admin/equipment/reservations/${id}`);
}

export function updateAdminEquipmentReservationStatus(
  id: number,
  status: 'Validée' | 'Refusée',
  noteInterne?: string,
): Promise<AdminEquipmentReservation> {
  return request<AdminEquipmentReservation>(`/api/admin/equipment/reservations/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, noteInterne }),
  });
}

export function createAdminEquipment(data: FormData | Record<string, unknown>): Promise<Equipment> {
  return request<Equipment>('/api/admin/equipment', {
    method: 'POST',
    body: data instanceof FormData ? data : JSON.stringify(data),
  });
}

export function updateAdminEquipment(
  id: number,
  data: FormData | Record<string, unknown>,
): Promise<Equipment> {
  return request<Equipment>(`/api/admin/equipment/${id}`, {
    method: data instanceof FormData ? 'POST' : 'PUT',
    body: data instanceof FormData ? data : JSON.stringify(data),
  });
}

export function checkEquipmentStock(id: number, stockTotal: number): Promise<StockCheckResult> {
  return request<StockCheckResult>(`/api/admin/equipment/${id}/check-stock`, {
    method: 'POST',
    body: JSON.stringify({ stockTotal }),
  });
}

export function getEquipmentStockAdjustments(id: number): Promise<StockAdjustment[]> {
  return request<StockAdjustment[]>(`/api/admin/equipment/${id}/stock-adjustments`);
}

export function deleteAdminEquipment(id: number): Promise<{ message: string; equipment: Equipment }> {
  return request<{ message: string; equipment: Equipment }>(`/api/admin/equipment/${id}`, {
    method: 'DELETE',
  });
}
export async function getPublicEquipment(): Promise<Equipment[]> {
  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('token') || localStorage.getItem('admin_token'))
    : null;

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/api/equipment`, {
    headers,
  });
  if (!response.ok) {
    throw new ApiError('Impossible de charger le catalogue de matériel.', response.status);
  }
  return response.json();
}
