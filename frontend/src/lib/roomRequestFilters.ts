import type {
  CampaignRequestFilterValues,
  CampaignRequestStatusFilter,
} from '@/components/admin/campaign/CampaignRequestFilters';
import type { CampaignRequest } from '@/lib/api/types';

export function countRequestsByStatus(requests: CampaignRequest[]): Record<CampaignRequestStatusFilter, number> {
  return requests.reduce(
    (counts, request) => ({ ...counts, [request.status]: counts[request.status] + 1, all: counts.all + 1 }),
    { pending: 0, accepted: 0, refused: 0, closed: 0, all: 0 },
  );
}

export function applyRequestFilters(requests: CampaignRequest[], filters: CampaignRequestFilterValues): CampaignRequest[] {
  const search = filters.search.trim().toLocaleLowerCase('fr');
  return requests.filter(
    (request) =>
      (filters.status === 'all' || request.status === filters.status) &&
      (!filters.salleId || String(request.salle.id) === filters.salleId) &&
      (!search || (request.association.nom ?? '').toLocaleLowerCase('fr').includes(search)),
  );
}

/** Associations distinctes dont une demande chevauche celle-ci sur la même salle. */
export function competitorNames(request: CampaignRequest, associationNames: Map<number, string>): string[] {
  return [...new Set(request.conflictsWith.map((id) => associationNames.get(id) ?? '').filter(Boolean))];
}
