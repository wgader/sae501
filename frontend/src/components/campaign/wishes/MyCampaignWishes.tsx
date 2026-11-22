import WishStatusBadge from '@/components/campaign/wishes/WishStatusBadge';
import WishSummaryTable from '@/components/campaign/wishes/WishSummaryTable';
import type { CampaignWishSubmission } from '@/lib/api';
import { formatInstant } from '@/lib/campaignDates';

/** Dossiers déjà transmis, avec la décision de la mairie pour chaque vœu. */
export default function MyCampaignWishes({ submissions }: { submissions: CampaignWishSubmission[] }) {
  if (submissions.length === 0) {
    return <p className="rounded-card border border-dashed border-line bg-paper px-6 py-8 text-center text-body-sm text-muted">Aucun vœu transmis pour cette campagne.</p>;
  }

  return (
    <div className="space-y-6">
      {submissions.map((submission) => (
        <div key={submission.id} className="space-y-2">
          <p className="text-meta font-bold text-muted">Dossier transmis le {formatInstant(submission.submittedAt)}</p>
          <WishSummaryTable
            caption={`Vœux transmis le ${formatInstant(submission.submittedAt)}`}
            rows={submission.wishes.map((wish) => ({
              key: wish.id,
              salle: wish.salle.nom,
              day: wish.dayLabel,
              hours: `${wish.startTime} – ${wish.endTime}`,
              frequency: wish.frequencyLabel,
              activity: wish.activity,
              audience: wish.audienceLabel,
              attendance: wish.expectedAttendance,
              status: <WishStatusBadge status={wish.status} />,
              note: wish.decisionComment,
            }))}
          />
        </div>
      ))}
    </div>
  );
}
