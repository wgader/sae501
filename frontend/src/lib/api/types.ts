export type AssociationStatus = 'PENDING_VALIDATION' | 'VALIDATED' | 'REFUSED' | 'SUSPENDED';
export type AssociationModule = 'evenements' | 'subventions' | 'materiel' | 'salles';

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
  statut: 'Disponible' | 'Archivé';
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
  documents: RequestDocument[];
  timeline: RequestTimelineEvent[];
};

export type EventAnnexFile = {
  id: number;
  originalName: string;
  fileType: string;
  mimeType: string;
  fileSize: number;
  createdAt: string | null;
  original_name?: string;
  file_type?: string;
  mime_type?: string;
  file_size?: number;
};

export type EventAnnexes = {
  event: AssociationRequestDetail;
  files: EventAnnexFile[];
  missingFiles: string[];
  documentsRequestMessage: string | null;
  documentsRequestedAt: string | null;
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

export type AdminAgentsResponse = {
  items: AdminAgent[];
  page: number;
  itemsPerPage: number;
  totalItems: number;
};

export type RoomOpeningHours = {
  debut: string;
  fin: string;
};

export type PublicRoom = Salle & {
  horairesOuverture: RoomOpeningHours;
};

export type OccupiedSlot = {
  id: number;
  start: string;
  end: string;
  statut: string;
  isPreReserved: boolean;
};

export type RoomAvailabilityResponse = {
  room: PublicRoom;
  start: string;
  end: string;
  occupiedSlots: OccupiedSlot[];
};

export type CreateRoomReservationInput = {
  salleId: number;
  motifEvenement: string;
  dateDebut: string;
  dateFin: string;
  capaciteAttendue?: number | null;
  justificatif?: File | null;
};

export type RoomReservationResponse = {
  id: number;
  statut: string;
  motifEvenement: string;
  dateDebut: string;
  dateFin: string;
  capaciteAttendue: number | null;
  createdAt: string;
  salle: PublicRoom | null;
  message: string;
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

export type CampaignStatus = 'PROGRAMMED' | 'ACTIVE' | 'CLOSED';

export type Campaign = {
  id: number;
  seasonLabel: string;
  openingAt: string;
  closingAt: string;
  resourceTypes: string[];
  status: CampaignStatus;
  statusLabel?: string;
  createdAt: string;
  updatedAt: string;
};

export type CampaignCurrentResponse = {
  active: boolean;
  campaign: Campaign | null;
};
