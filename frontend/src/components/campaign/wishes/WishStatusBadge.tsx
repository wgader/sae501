import StatusBadge from '@/components/ui/StatusBadge';
import type { CampaignWishStatus } from '@/lib/api';

const CODES = {
  'En attente d’arbitrage par la mairie': 'PENDING_VALIDATION',
  Attribué: 'VALIDATED',
  Refusé: 'REFUSED',
} as const;

export default function WishStatusBadge({ status }: { status: CampaignWishStatus }) {
  return <StatusBadge status={CODES[status] ?? 'PENDING_VALIDATION'} label={status === 'En attente d’arbitrage par la mairie' ? 'En attente d’arbitrage' : status} />;
}
