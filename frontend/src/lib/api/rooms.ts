import { publicRequest, request } from './client';
import type {
  CreateRoomReservationInput,
  PublicRoom,
  RoomAvailabilityResponse,
  RoomBookingRules,
  RoomReservationResponse,
} from './types';

export function getPublicRooms(): Promise<PublicRoom[]> {
  return publicRequest<PublicRoom[]>('/api/rooms');
}

export function getRoomBookingRules(): Promise<RoomBookingRules> {
  return publicRequest<RoomBookingRules>('/api/rooms/booking-rules');
}

export function getRoomAvailability(
  roomId: number,
  start?: string,
  end?: string,
): Promise<RoomAvailabilityResponse> {
  const params = new URLSearchParams();
  if (start) params.set('start', start);
  if (end) params.set('end', end);
  const query = params.toString() ? `?${params.toString()}` : '';
  return publicRequest<RoomAvailabilityResponse>(`/api/rooms/${roomId}/availability${query}`);
}

export function createRoomReservation(
  input: CreateRoomReservationInput,
): Promise<RoomReservationResponse> {
  const body = new FormData();
  body.append('salleId', String(input.salleId));
  body.append('motifEvenement', input.motifEvenement);
  body.append('dateDebut', input.dateDebut);
  body.append('dateFin', input.dateFin);
  if (input.capaciteAttendue !== undefined && input.capaciteAttendue !== null) {
    body.append('capaciteAttendue', String(input.capaciteAttendue));
  }
  if (input.justificatif) body.append('justificatif', input.justificatif);
  return request<RoomReservationResponse>(input.forCampaign ? '/api/campaigns/current/requests' : '/api/rooms/reservations', {
    method: 'POST',
    body,
  });
}
