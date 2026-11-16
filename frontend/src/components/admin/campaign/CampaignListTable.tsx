import type { Campaign } from '@/lib/api/types';
import CampaignStatusBadge from './CampaignStatusBadge';

interface CampaignListTableProps {
  campaigns: Campaign[];
  isLoading: boolean;
  onOpenClick: (campaign: Campaign) => void;
  onCloseClick: (campaign: Campaign) => void;
}

export default function CampaignListTable({
  campaigns,
  isLoading,
  onOpenClick,
  onCloseClick,
}: CampaignListTableProps) {
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  if (isLoading || campaigns.length === 0) {
    return null;
  }

  return (
    <div className="rounded-card border border-line bg-white shadow-card overflow-hidden">
      <div className="border-b border-line px-6 py-4 bg-paper/40">
        <h3 className="text-body-sm font-black uppercase tracking-wider text-ink">
          Campagnes configurées ({campaigns.length})
        </h3>
        <p className="mt-0.5 text-meta text-muted">
          Suivi des périodes de dépôt et contrôle d&apos;ouverture / clôture
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-body-sm">
          <thead className="border-b border-line bg-paper/60 text-meta font-bold uppercase tracking-wider text-muted">
            <tr>
              <th scope="col" className="px-6 py-3.5">Saison / Intitulé</th>
              <th scope="col" className="px-6 py-3.5">Statut</th>
              <th scope="col" className="px-6 py-3.5">Ouverture</th>
              <th scope="col" className="px-6 py-3.5">Clôture</th>
              <th scope="col" className="px-6 py-3.5 text-right">Actions rapides</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {campaigns.map((camp) => {
              const isProgrammed = camp.status === 'PROGRAMMED';
              const isActive = camp.status === 'ACTIVE';

              return (
                <tr key={camp.id} className="hover:bg-paper/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-ink">
                    {camp.seasonLabel}
                  </td>
                  <td className="px-6 py-4">
                    <CampaignStatusBadge status={camp.status} />
                  </td>
                  <td className="px-6 py-4 text-meta text-muted">
                    {formatDate(camp.openingAt)}
                  </td>
                  <td className="px-6 py-4 text-meta text-muted">
                    {formatDate(camp.closingAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {isProgrammed && (
                        <button
                          type="button"
                          onClick={() => onOpenClick(camp)}
                          className="inline-flex items-center gap-1 rounded-control bg-primary px-3 py-1.5 text-meta font-bold text-white shadow-2xs transition hover:bg-primary-hover cursor-pointer"
                        >
                          Ouvrir maintenant
                        </button>
                      )}
                      {isActive && (
                        <button
                          type="button"
                          onClick={() => onCloseClick(camp)}
                          className="inline-flex items-center gap-1 rounded-control bg-danger px-3 py-1.5 text-meta font-bold text-white shadow-2xs transition hover:bg-rose-700 cursor-pointer"
                        >
                          Clôturer
                        </button>
                      )}
                      {camp.status === 'CLOSED' && (
                        <span className="text-meta text-muted italic">
                          Clôturée
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
