import CampaignRequestCard from '@/components/admin/campaign/CampaignRequestCard';
import { formatDayLabel, slotDate } from '@/lib/campaignDates';
import { competitorNames } from '@/lib/roomRequestFilters';
import type { CampaignRequest } from '@/lib/api/types';

interface CampaignRequestListProps {
  requests: CampaignRequest[];
  /** Toutes les demandes de la campagne, pour nommer les associations en concurrence. */
  allRequests: CampaignRequest[];
  onAccept: (request: CampaignRequest) => void;
  /** Absent pour une réservation ponctuelle, que la mairie accepte ou refuse telle quelle. */
  onReschedule?: (request: CampaignRequest) => void;
  onRefuse: (request: CampaignRequest) => void;
  onCancel: (request: CampaignRequest) => void;
  onNotifyConflict?: (request: CampaignRequest) => void;
}

interface DayGroup {
  date: string;
  requests: CampaignRequest[];
}

function groupByDay(requests: CampaignRequest[]): DayGroup[] {
  const groups = new Map<string, CampaignRequest[]>();
  requests.forEach((request) => {
    const date = slotDate(request.dateDebut);
    groups.set(date, [...(groups.get(date) ?? []), request]);
  });

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, dayRequests]) => ({
      date,
      requests: dayRequests.sort((a, b) => (a.dateDebut ?? '').localeCompare(b.dateDebut ?? '')),
    }));
}

/** Demandes regroupées par jour, dans l'ordre chronologique. */
export default function CampaignRequestList({
  requests,
  allRequests,
  onAccept,
  onReschedule,
  onRefuse,
  onCancel,
  onNotifyConflict,
}: CampaignRequestListProps) {
  const associationNames = new Map(allRequests.map((request) => [request.id, request.association.nom ?? '']));
  const days = groupByDay(requests);

  return (
    <ol className="space-y-8">
      {days.map((day) => (
        <li key={day.date}>
          <h3 className="mb-3 text-label font-bold uppercase tracking-label text-primary first-letter:uppercase">
            <time dateTime={day.date}>{formatDayLabel(day.date)}</time>
          </h3>
          <ul className="grid gap-4 xl:grid-cols-2">
            {day.requests.map((request) => (
              <li key={request.id}>
                <CampaignRequestCard
                  request={request}
                  competitors={competitorNames(request, associationNames)}
                  onAccept={onAccept}
                  onReschedule={onReschedule}
                  onRefuse={onRefuse}
                  onCancel={onCancel}
                  onNotifyConflict={onNotifyConflict}
                />
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
