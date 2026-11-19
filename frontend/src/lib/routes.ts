/**
 * Adresses des pages de détail. Le site est exporté en fichiers statiques : l'identifiant passe
 * dans la query string (?id=…), jamais dans le chemin.
 */
type AssociationSection = 'documents' | 'historique' | 'evenements';

const withQuery = (path: string, params: Record<string, string | number>) =>
  `${path}?${new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)]))}`;

export const routes = {
  adminAssociation: (id: number, section?: AssociationSection) =>
    withQuery(section ? `/admin/association/fiche/${section}` : '/admin/association/fiche', { id }),
  adminAssociationRequestAnnexes: (id: number, type: string, requestId: string | number) =>
    withQuery('/admin/association/fiche/historique/pieces-annexes', { id, type, requestId }),
  adminRegistration: (id: number) => withQuery('/admin/inscription/dossier', { id }),
  adminGrant: (id: number) => withQuery('/admin/subvention/demande', { id }),
  adminEquipmentRequest: (id: number) => withQuery('/admin/materiel/demandes/detail', { id }),
  adminEventAnnexes: (id: number) => withQuery('/admin/evenements/pieces-annexes', { id }),
  request: (id: string | number, type?: string) =>
    withQuery('/historique/demande', type ? { id, type } : { id }),
  requestAnnexes: (id: string | number, type: string) =>
    withQuery('/historique/demande/pieces-annexes', { id, type }),
  equipmentBooking: (id: number) => withQuery('/materiel/reserver', { id }),
};
