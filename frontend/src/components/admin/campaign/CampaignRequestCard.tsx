import { cva } from 'class-variance-authority';
import Button from '@/components/ui/Button';
import { IconCheck, IconClock, IconEdit, IconLocation, IconMembres, IconWarning } from '@/components/ui/icons';
import CampaignRequestStatusBadge from '@/components/admin/campaign/CampaignRequestStatusBadge';
import { formatSlotTime } from '@/lib/campaignDates';
import type { CampaignRequest } from '@/lib/api/types';

const cardVariants = cva('flex flex-col gap-4', {
  variants: {
    flat: {
      true: '',
      false: 'rounded-card border border-line bg-white p-4 shadow-card sm:p-5',
    },
  },
});

interface CampaignRequestCardProps {
  request: CampaignRequest;
  /** Associations dont la demande chevauche celle-ci sur la même salle. */
  competitors: string[];
  onAccept: (request: CampaignRequest) => void;
  /** Absent pour une réservation ponctuelle, que la mairie accepte ou refuse telle quelle. */
  onReschedule?: (request: CampaignRequest) => void;
  onRefuse: (request: CampaignRequest) => void;
  onCancel: (request: CampaignRequest) => void;
  /** Prévient les associations en concurrence (absent hors campagne). */
  onNotifyConflict?: (request: CampaignRequest) => void;
  /** Sans cadre ni ombre, pour l'afficher dans une fenêtre. */
  flat?: boolean;
}

export default function CampaignRequestCard({
  request,
  competitors,
  onAccept,
  onReschedule,
  onRefuse,
  onCancel,
  onNotifyConflict,
  flat = false,
}: CampaignRequestCardProps) {
  const titleId = `campaign-request-${request.id}`;
  const canDecide = request.status !== 'closed';
  const canAccept = request.status !== 'accepted' && canDecide;
  const canRefuse = request.status === 'pending';
  const canCancel = request.status === 'accepted';
  const hasCompetitors = competitors.length > 0 && request.status !== 'refused';

  return (
    <article aria-labelledby={titleId} className={cardVariants({ flat })}>
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 id={titleId} className="truncate text-body font-black text-ink">
            {request.association.nom ?? 'Association inconnue'}
          </h4>
          <p className="mt-0.5 text-body-sm text-muted">{request.motifEvenement}</p>
        </div>
        <CampaignRequestStatusBadge status={request.status} conflict={hasCompetitors} />
      </header>

      <ul className="grid gap-2 text-body-sm text-ink sm:grid-cols-3">
        <li className="flex items-center gap-2">
          <IconClock className="h-4 w-4 shrink-0 text-primary" />
          <span>
            {formatSlotTime(request.dateDebut)} – {formatSlotTime(request.dateFin)}
          </span>
        </li>
        <li className="flex min-w-0 items-center gap-2">
          <IconLocation className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate">{request.salle.nom}</span>
        </li>
        {request.capaciteAttendue !== null && (
          <li className="flex items-center gap-2">
            <IconMembres className="h-4 w-4 shrink-0 text-primary" />
            <span>
              {request.capaciteAttendue} pers.
              {request.salle.capaciteMax !== null && <span className="text-muted"> / {request.salle.capaciteMax}</span>}
            </span>
          </li>
        )}
      </ul>

      {hasCompetitors && (
        <p role="note" className="flex items-start gap-2 rounded-soft bg-danger/10 px-3 py-2 text-meta text-ink">
          <IconWarning className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
          <span>
            Même salle, même créneau que : <strong>{competitors.join(', ')}</strong>. Une seule demande pourra être
            acceptée : départagez-les en réunion, puis acceptez, déplacez ou refusez.
          </span>
        </p>
      )}

      {request.decisionComment && (
        <p className="rounded-soft bg-paper px-3 py-2 text-meta text-ink">
          <span className="block text-caption font-bold uppercase tracking-label text-muted">Message envoyé</span>
          {request.decisionComment}
        </p>
      )}

      {canDecide && (
        <footer className="flex flex-col gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
          {hasCompetitors && request.status === 'pending' && onNotifyConflict && (
            <Button variant="ghost" size="sm" onClick={() => onNotifyConflict(request)}>
              Prévenir du conflit
            </Button>
          )}
          {canCancel && (
            <Button variant="ghost" size="sm" onClick={() => onCancel(request)}>
              Annuler la réservation
            </Button>
          )}
          {canRefuse && (
            <Button variant="ghost" size="sm" onClick={() => onRefuse(request)}>
              Refuser
            </Button>
          )}
          {onReschedule && (
            <Button variant="secondary" size="sm" leftIcon={<IconEdit className="h-4 w-4" />} onClick={() => onReschedule(request)}>
              Modifier
            </Button>
          )}
          {canAccept && (
            <Button size="sm" leftIcon={<IconCheck className="h-4 w-4" />} onClick={() => onAccept(request)}>
              Accepter
            </Button>
          )}
        </footer>
      )}
    </article>
  );
}
