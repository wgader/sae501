const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';

export function getMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

export type AssociationStatus = 'PENDING_VALIDATION' | 'VALIDATED' | 'REFUSED' | 'SUSPENDED';
export type AssociationModule = 'evenements' | 'subventions' | 'materiel' | 'salles';

export type AdminAgent = {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  telephone: string | null;
  roles: string[];
  isVerified: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string | null;
};

export type AdminAgentPayload = {
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  roles: string[];
};

export type AssociationContact = {
  nom: string;
  prenom: string;
  nomComplet?: string;
  email: string;
  telephone: string | null;
};

export type Association = {
  id: number;
  nom: string;
  numeroRna?: string;
  statut: AssociationStatus;
  permissions: AssociationModule[];
  moduleSubventionActif?: boolean;
  moduleSalleActif?: boolean;
  moduleMaterielActif?: boolean;
  createdAt: string | null;
  contact?: AssociationContact | null;
  nombreMembres?: number | null;
  categorie?: string | null;
  imageUrl?: string | null;
  documents?: AssociationDocument[];
};

export type AssociationDocument = {
  id: number;
  typeDocument: string;
  fichierUrl: string;
  isVerified: boolean;
  size: number;
  originalName: string;
  mimeType: string;
  createdAt: string | null;
};

export type AssociationCounts = {
  pending: number;
  validated: number;
  refused: number;
  total: number;
};

export type AssociationPage = {
  items: Association[];
  page: number;
  itemsPerPage: number;
  totalItems: number;
  counts?: AssociationCounts;
};

export type Salle = {
  id: number;
  nom: string;
  description: string | null;
  imageUrl: string | null;
  adresse: string;
  capaciteMax: number;
  accesPmr: boolean;
  equipementsInclus: string[];
  createdAt: string | null;
  updatedAt: string | null;
  isActive: boolean;
  deletedAt: string | null;
};

export type Equipment = {
  id: number;
  designation: string;
  categorie: string;
  referenceInterne: string | null;
  description: string | null;
  consignesUtilisation: string | null;
  stockTotal: number;
  isArchived: boolean;
  statut: 'Disponible' | 'ArchivÃ©';
  imagePath: string | null;
  createdAt: string | null;
};

export type EquipmentAvailability = Equipment & {
  stockEngage: number;
  stockDisponible: number;
};

export type EquipmentAvailabilityResponse = {
  start: string;
  end: string;
  items: EquipmentAvailability[];
};

export type EquipmentReservationLineInput = {
  materielId: number;
  quantite: number;
};

export type EquipmentReservationInput = {
  motifEvenement: string;
  dateRetrait: string;
  dateRestitution: string;
  lignes: EquipmentReservationLineInput[];
};

export type EquipmentReservation = {
  id: number | null;
  statut: 'En attente' | 'En cours de traitement' | 'Complément requis' | 'Validée' | 'Refusée' | 'Clôturée';
  motifEvenement: string | null;
  dateRetrait: string | null;
  dateRestitution: string | null;
  lignes: Array<{
    materielId: number | null;
    designation: string | null;
    quantite: number | null;
  }>;
};

export type AdminEquipmentReservation = EquipmentReservation & {
  createdAt: string | null;
  updatedAt: string | null;
  noteInterne: string | null;
  association: {
    id: number | null;
    nom: string | null;
    contact: {
      nom: string | null;
      prenom: string | null;
      email: string | null;
      telephone: string | null;
    };
  };
  documents: AssociationDocument[];
};

export type AdminEquipmentReservationPage = {
  items: AdminEquipmentReservation[];
  page: number;
  itemsPerPage: number;
  totalItems: number;
  counts: {
    pending: number;
    validated: number;
    refused: number;
    total: number;
  };
};

export type StockCheckResult = {
  equipmentId: number;
  currentStock: number;
  requestedStock: number;
  hasConflict: boolean;
  maxBooked: number;
  conflictingReservations: Array<{
    id: number;
    association: string;
    motif: string;
    dateRetrait: string;
    dateRestitution: string;
    quantite: number;
  }>;
};

export type StockAdjustment = {
  id: number;
  previousStock: number;
  newStock: number;
  reason: string;
  createdAt: string;
  agent: {
    id: number | null;
    nom: string | null;
    prenom: string | null;
  };
};

export type AccountProfile = {
  id: number | null;
  email: string | null;
  telephone: string | null;
  nom: string | null;
  prenom: string | null;
  nomAssociation?: string | null;
  typeCompte?: string | null;
  moduleSubventionActif?: boolean | null;
  moduleMaterielActif?: boolean | null;
  moduleSalleActif?: boolean | null;
  moduleEvenementActif?: boolean | null;
};

export type MunicipalAgent = {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  roles: string[];
};

export type MunicipalAgentsResponse = {
  items: MunicipalAgent[];
  page: number;
  itemsPerPage: number;
  totalItems: number;
};

export function getMunicipalAgents(): Promise<MunicipalAgentsResponse> {
  return request<MunicipalAgentsResponse>('/api/admin/agents?page=1&itemsPerPage=50');
}

export function deleteMunicipalAgent(id: number): Promise<void> {
  return request<void>(`/api/admin/agents/${id}`, { method: 'DELETE' });
}

export type RequestType = 'subvention' | 'materiel' | 'salle' | 'evenement';
export type RequestStatusCategory = 'active' | 'closed';

export type AssociationRequestSummary = {
  id: string;
  rawId: number;
  type: RequestType;
  typeLabel: string;
  intitule: string;
  statut?: string | null;
  statusCategory: RequestStatusCategory;
  createdAt: string;
  year: number;
  keyDates: {
    depot: string;
    decision?: string;
    exercice?: string;
    retrait?: string;
    restitution?: string;
    debut?: string;
    fin?: string;
  };
  decisionMotif?: string | null;
  observations?: string | null;
  summary: string;
};

export type RequestTimelineEvent = {
  id?: number;
  statut: string;
  label: string;
  commentaire?: string | null;
  auteur?: string | null;
  date: string;
};

export type RequestDocument = {
  id: number;
  typeDocument: string;
  fichierUrl: string;
  description?: string | null;
  createdAt?: string | null;
};

export type AssociationRequestDetail = AssociationRequestSummary & {
  typeSubvention?: string;
  description?: string | null;
  montantDemande?: number;
  montantAccorde?: number | null;
  anneeExercice?: number;
  lignes?: Array<{
    materielId?: number;
    designation: string;
    categorie?: string;
    quantite: number;
    imagePath?: string | null;
  }>;
  cautionMontant?: number | null;
  cautionPayeeAt?: string | null;
  materielRetireAt?: string | null;
  materielRestitueAt?: string | null;
  cautionRendueAt?: string | null;
  salleId?: number;
  salleNom?: string;
  salleAdresse?: string;
  salleCapaciteMax?: number;
  salleAccesPmr?: boolean;
  salleEquipements?: string[];
  capaciteAttendue?: number | null;
  location?: string;
  eventType?: string;
  files?: EventAnnexFile[];
  missingFiles?: string[];
  documentsRequestMessage?: string | null;
  documentsRequestedAt?: string | null;
  documents?: RequestDocument[];
  timeline: RequestTimelineEvent[];
};

export type EventAnnexFile = {
  id: number;
  originalName: string;
  fileType: string;
  mimeType: string;
  fileSize: number;
  createdAt: string | null;
};

export type EventAnnexes = {
  event: AssociationRequestDetail;
  files: EventAnnexFile[];
  missingFiles: string[];
  documentsRequestMessage: string | null;
  documentsRequestedAt: string | null;
};

export type AssociationRequestsResponse = {
  items: AssociationRequestSummary[];
  totalItems: number;
  page: number;
  limit: number;
  totalPages: number;
  counts: {
    all: number;
    active: number;
    closed: number;
    subvention: number;
    materiel: number;
    salle: number;
    evenement: number;
  };
};

export type AssociationNotification = {
  id: number;
  title: string;
  message: string;
  type: string;
  event_id?: number | null;
  read_at: string | null;
  created_at: string;
};

export type AssociationNotificationsResponse = {
  items: AssociationNotification[];
  unreadCount: number;
};

export function getAssociationNotifications(): Promise<AssociationNotificationsResponse> {
  return request<AssociationNotificationsResponse>('/api/notifications?itemsPerPage=10');
}

export function markAssociationNotificationRead(id: number): Promise<AssociationNotification> {
  return request<AssociationNotification>(`/api/notifications/${id}/read`, { method: 'PATCH' });
}

export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly data?: unknown) {
    super(message);
  }
}

function redirectToAdminLogin(): never {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('token');
  window.location.replace('/admin');
  throw new ApiError('Redirection vers la connexion administrateur.', 401);
}

function redirectToAssociationLogin(): never {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('association_name');
    window.dispatchEvent(new Event('auth-change'));
    window.location.replace('/connexion');
  }
  throw new ApiError('Votre session a expirÃ©. Redirection vers la page de connexion...', 401);
}

function getToken(): string {
  const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
  if (!token) return redirectToAdminLogin();
  return token;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${getToken()}`,
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });
  const data = await response.json().catch(() => null);
  if (response.status === 401) redirectToAdminLogin();
  if (!response.ok) {
    throw new ApiError(
      typeof data?.message === 'string' ? data.message : 'Une erreur est survenue.',
      response.status,
      data,
    );
  }
  return data as T;
}

async function accountRequest<T>(
  path: string,
  options: RequestInit = {},
  defaultErrorMessage = 'Une erreur est survenue lors de la communication avec le serveur.',
): Promise<T> {
  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('token') || localStorage.getItem('admin_token'))
    : null;
  if (!token) {
    return redirectToAssociationLogin();
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => null);

  if (response.status === 401) {
    return redirectToAssociationLogin();
  }

  if (!response.ok) {
    throw new ApiError(
      typeof data?.message === 'string' ? data.message : defaultErrorMessage,
      response.status,
      data,
    );
  }

  return data as T;
}

export function getAccountProfile(): Promise<AccountProfile> {
  return accountRequest<AccountProfile>(
    '/api/account/profile',
    {},
    'Impossible de charger les informations du profil.',
  );
}

export function updateAccountProfile(payload: {
  email?: string;
  telephone?: string | null;
}): Promise<AccountProfile> {
  return accountRequest<AccountProfile>(
    '/api/account/profile',
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
    'Impossible de mettre Ã  jour le profil.',
  );
}

export function getAssociationRequests(filters?: {
  status?: string;
  type?: string;
  year?: string | number;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<AssociationRequestsResponse> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.type) params.set('type', filters.type);
  if (filters?.year) params.set('year', String(filters.year));
  if (filters?.search) params.set('search', filters.search);
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));

  const qs = params.toString();
  return accountRequest<AssociationRequestsResponse>(
    `/api/association/requests${qs ? `?${qs}` : ''}`,
    {},
    'Impossible de rÃ©cupÃ©rer la liste des dÃ©marches.',
  );
}

export function getAssociationRequestDetail(
  id: string,
  type?: string
): Promise<AssociationRequestDetail> {
  const qs = type ? `?type=${encodeURIComponent(type)}` : '';
  return accountRequest<AssociationRequestDetail>(
    `/api/association/requests/${encodeURIComponent(id)}${qs}`,
    {},
    'Impossible de charger le dÃ©tail du dossier.',
  );
}

export function uploadAssociationRequestDocument(
  id: string,
  type: 'materiel' | 'salle',
  file: File,
  typeDocument?: string,
): Promise<RequestDocument> {
  const body = new FormData();
  body.append('file', file);
  body.append('type', type);
  if (typeDocument) body.append('typeDocument', typeDocument);

  return accountRequest<RequestDocument>(
    `/api/association/requests/${encodeURIComponent(id)}/documents`,
    {
      method: 'POST',
      body,
    },
    'Impossible de dÃ©poser cette piÃ¨ce.',
  );
}

export async function getAssociationEventAnnexes(eventId: number): Promise<EventAnnexes> {
  const detail = await getAssociationRequestDetail(`event-${eventId}`, 'evenement');

  return {
    event: detail,
    files: detail.files ?? [],
    missingFiles: detail.missingFiles ?? [],
    documentsRequestMessage: detail.documentsRequestMessage ?? null,
    documentsRequestedAt: detail.documentsRequestedAt ?? null,
  };
}

export function uploadAssociationEventFile(
  eventId: number,
  file: File,
): Promise<ExternalEventFile> {
  const formData = new FormData();
  formData.append('file', file);

  return accountRequest<ExternalEventFile>(
    `/api/events/${eventId}/files`,
    {
      method: 'POST',
      body: formData,
    },
    'Impossible de dÃ©poser cette piÃ¨ce.',
  );
}

export async function downloadAssociationEventFile(fileId: number): Promise<Blob> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token) {
    return redirectToAssociationLogin();
  }

  const response = await fetch(`${API_URL}/api/events/association/files/${fileId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    return redirectToAssociationLogin();
  }

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new ApiError(
      typeof data?.message === 'string' ? data.message : 'Impossible de consulter cette piÃ¨ce.',
      response.status,
      data,
    );
  }

  return response.blob();
}

export function cancelAssociationRequest(
  id: string,
  type: 'materiel' | 'salle',
): Promise<{ id: string; type: string; statut: string; updatedAt: string | null }> {
  return accountRequest(
    `/api/association/requests/${encodeURIComponent(id)}/cancel`,
    {
      method: 'POST',
      body: JSON.stringify({ type }),
    },
    'Impossible dâ€™annuler cette rÃ©servation.',
  );
}

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

export async function registerAssociation(payload: {
  nomAssociation: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  cguAccepted: boolean;
}): Promise<void> {
  const response = await fetch(`${API_URL}/api/auth/register/association`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      typeof data?.message === 'string' ? data.message : 'Une erreur est survenue.',
      response.status,
    );
  }
}

export function getAssociations(
  page: number,
  status: AssociationStatus | '',
  search?: string,
  includeCounts?: boolean,
  itemsPerPage: number = 10,
): Promise<AssociationPage> {
  const params = new URLSearchParams({ page: String(page), itemsPerPage: String(itemsPerPage) });
  if (status) params.set('status', status);
  if (search) params.set('q', search);
  if (includeCounts !== undefined) params.set('includeCounts', String(includeCounts));
  return request<AssociationPage>(`/api/admin/associations?${params.toString()}`);
}

export function getAdminAgents(
  page = 1,
  search?: string,
): Promise<{
  items: AdminAgent[];
  page: number;
  itemsPerPage: number;
  totalItems: number;
}> {
  const params = new URLSearchParams({
    page: String(page),
    itemsPerPage: '50',
  });
  if (search) params.set('q', search);

  return request(`/api/admin/agents?${params.toString()}`);
}

export function createAdminAgent(payload: AdminAgentPayload): Promise<AdminAgent> {
  return request<AdminAgent>('/api/admin/agents', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateAdminAgent(id: number, payload: Partial<AdminAgentPayload>): Promise<AdminAgent> {
  return request<AdminAgent>(`/api/admin/agents/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteAdminAgent(id: number): Promise<void> {
  return request<void>(`/api/admin/agents/${id}`, { method: 'DELETE' });
}

export function getAssociation(id: number): Promise<Association> {
  return request<Association>(`/api/admin/associations/${id}`);
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
  type: RequestType,
): Promise<AssociationRequestDetail> {
  return request<AssociationRequestDetail>(
    `/api/admin/associations/${associationId}/requests/${encodeURIComponent(requestId)}?type=${encodeURIComponent(type)}`,
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

export function updateAssociationStatus(
  id: number,
  status: AssociationStatus,
  permissions?: AssociationModule[],
): Promise<Association> {
  const body: { status: AssociationStatus; permissions?: AssociationModule[] } = { status };
  if (permissions !== undefined) {
    body.permissions = permissions;
  }
  return request<Association>(`/api/admin/associations/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export type ExternalEventFile = {
  id: number;
  event_id?: number;
  original_name: string;
  file_type: string;
  mime_type: string;
  file_size: number;
  sha256?: string;
};

export type ExternalEvent = {
  id: number;
  asso_id: number;
  association_name?: string | null;
  title: string;
  location: string;
  event_type: string;
  start_date: string;
  end_time: string;
  status: string;
  missing_files?: string[];
  documents_request_message?: string | null;
  documents_requested_at?: string | null;
  created_at: string;
  files?: ExternalEventFile[];
  description?: string;
  contact_nom?: string;
  contact_email?: string;
  contact_telephone?: string;
};

export type ExternalEventListPage = {
  items: ExternalEvent[];
  page: number;
  itemsPerPage: number;
  totalItems: number;
};

export type CreateExternalEventPayload = {
  title: string;
  location: string;
  event_type: string;
  start_date: string;
  end_time: string;
};

export async function createExternalEvent(payload: CreateExternalEventPayload): Promise<ExternalEvent> {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new ApiError('Vous devez Ãªtre connectÃ© avec un compte association.', 401);
  }

  const response = await fetch(`${API_URL}/api/events/external`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    let message = 'Erreur lors de la dÃ©claration de lâ€™Ã©vÃ©nement.';
    if (data?.errors && typeof data.errors === 'object') {
      message = Object.values(data.errors).join(' ');
    } else if (typeof data?.message === 'string') {
      message = data.message;
    }
    throw new ApiError(message, response.status);
  }

  return data as ExternalEvent;
}

export async function uploadExternalEventFile(eventId: number, file: File): Promise<ExternalEventFile> {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new ApiError('Vous devez Ãªtre connectÃ© avec un compte association.', 401);
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/api/events/external/${eventId}/files`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      typeof data?.message === 'string' ? data.message : 'Erreur lors du tÃ©lÃ©versement du fichier.',
      response.status,
    );
  }

  return data as ExternalEventFile;
}

export async function getExternalEvents(page = 1, itemsPerPage = 10): Promise<ExternalEventListPage> {
  const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
  if (!token) {
    redirectToAdminLogin();
  }

  const params = new URLSearchParams({
    page: String(page),
    itemsPerPage: String(itemsPerPage),
  });

  const response = await fetch(`${API_URL}/api/events?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      typeof data?.message === 'string' ? data.message : 'Erreur lors du chargement des Ã©vÃ©nements.',
      response.status,
    );
  }

  return data as ExternalEventListPage;
}

export async function getExternalEvent(id: number): Promise<ExternalEvent> {
  const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
  if (!token) {
    redirectToAdminLogin();
  }

  const response = await fetch(`${API_URL}/api/events/${id}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      typeof data?.message === 'string' ? data.message : 'Ã‰vÃ©nement introuvable.',
      response.status,
    );
  }

  return data as ExternalEvent;
}

export async function updateExternalEventStatus(
  id: number,
  status: 'VALIDATED',
): Promise<ExternalEvent> {
  const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
  if (!token) {
    redirectToAdminLogin();
  }


  const response = await fetch(`${API_URL}/api/events/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      typeof data?.message === 'string' ? data.message : 'Impossible de valider lâ€™Ã©vÃ©nement.',
      response.status,
    );
  }

  return data as ExternalEvent;
}

export async function downloadExternalEventFile(fileId: number, originalName: string): Promise<void> {
  const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
  if (!token) {
    redirectToAdminLogin();
  }

  const response = await fetch(`${API_URL}/api/events/files/${fileId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new ApiError(
      typeof data?.message === 'string' ? data.message : 'Impossible de tÃ©lÃ©charger le fichier.',
      response.status,
    );
  }

  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = originalName || `fichier-${fileId}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export async function requestExternalEventFiles(
  eventId: number,
  missingFiles: string[],
  message: string,
): Promise<{ message: string; event_id: number; status: string; missing_files: string[] }> {
  const token = localStorage.getItem('admin_token');
  if (!token) {
    redirectToAdminLogin();
  }

  const response = await fetch(`${API_URL}/api/events/external/${eventId}/request-files`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ missing_files: missingFiles, message }),
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      typeof data?.message === 'string' ? data.message : 'Impossible d’envoyer la relance.',
      response.status,
      data,
    );
  }

  return data as { message: string; event_id: number; status: string; missing_files: string[] };
}

export function updateAssociationModules(
  id: number,
  permissions: AssociationModule[],
): Promise<Association> {
  return request<Association>(`/api/admin/associations/${id}/modules`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ permissions }),
  });
}

export function deleteAssociation(id: number): Promise<void> {
  return request<void>(`/api/admin/associations/${id}`, {
    method: 'DELETE',
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

export function uploadAssociationDocument(
  associationId: number,
  file: File,
  typeDocument?: string,
  isVerified?: boolean,
): Promise<AssociationDocument> {
  const body = new FormData();
  body.append('file', file);
  if (typeDocument) body.append('typeDocument', typeDocument);
  if (isVerified !== undefined) body.append('isVerified', String(isVerified));

  return request<AssociationDocument>(`/api/admin/associations/${associationId}/documents`, {
    method: 'POST',
    body,
  });
}

export function updateAssociationDocument(
  associationId: number,
  docId: number,
  data: { typeDocument?: string; isVerified?: boolean },
): Promise<AssociationDocument> {
  return request<AssociationDocument>(`/api/admin/associations/${associationId}/documents/${docId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function deleteAssociationDocument(
  associationId: number,
  docId: number,
): Promise<void> {
  return request<void>(`/api/admin/associations/${associationId}/documents/${docId}`, {
    method: 'DELETE',
  });
}

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
    throw new ApiError('Impossible de charger le catalogue de matÃ©riel.', response.status);
  }
  return response.json();
}
