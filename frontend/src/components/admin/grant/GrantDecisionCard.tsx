import { fieldControlVariants, fieldHintVariants, fieldLabelVariants } from '@/components/admin/campaign/fieldStyles';
import Button from '@/components/ui/Button';
import type { AdminGrantDetail } from '@/lib/api';
import { formatGrantAmount } from '@/lib/grantApplication';

interface GrantDecisionCardProps {
  grant: AdminGrantDetail;
  amount: string;
  message: string;
  isUpdating: boolean;
  onAmountChange: (amount: string) => void;
  onMessageChange: (message: string) => void;
  onDecide: (status: 'Validée' | 'Refusée') => void;
}

const PENDING = ['En attente', 'En cours de traitement'];

/** Décision de la mairie, visible à côté du dossier ; le message est envoyé à l'association. */
export default function GrantDecisionCard({
  grant,
  amount,
  message,
  isUpdating,
  onAmountChange,
  onMessageChange,
  onDecide,
}: GrantDecisionCardProps) {
  const isPending = PENDING.includes(grant.statut);

  return (
    <aside aria-labelledby="grant-decision-title" className="space-y-4 rounded-card border border-line bg-white p-5 shadow-card sm:p-6 lg:sticky lg:top-6 lg:col-span-4">
      <div>
        <h2 id="grant-decision-title" className="text-lg font-black text-ink">Décision</h2>
        <p className="mt-1 text-body-sm text-muted">L’association est prévenue par e-mail.</p>
      </div>

      {isPending ? (
        <>
          <div>
            <label htmlFor="grant-amount" className={fieldLabelVariants()}>Montant accordé (€)</label>
            <input
              id="grant-amount"
              inputMode="decimal"
              value={amount}
              disabled={isUpdating}
              onChange={(event) => onAmountChange(event.target.value)}
              className={fieldControlVariants()}
            />
            <p className={fieldHintVariants()}>Demandé : {formatGrantAmount(grant.montantDemande)}. Utilisé seulement si vous acceptez.</p>
          </div>
          <div>
            <label htmlFor="grant-message" className={fieldLabelVariants()}>Message à l’association</label>
            <textarea
              id="grant-message"
              value={message}
              rows={4}
              maxLength={2000}
              disabled={isUpdating}
              onChange={(event) => onMessageChange(event.target.value)}
              className={fieldControlVariants()}
            />
            <p className={fieldHintVariants()}>Obligatoire en cas de refus.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="danger" disabled={isUpdating || message.trim() === ''} onClick={() => onDecide('Refusée')}>
              Refuser
            </Button>
            <Button disabled={isUpdating} onClick={() => onDecide('Validée')}>
              Accepter
            </Button>
          </div>
        </>
      ) : (
        <div className="space-y-2 rounded-soft bg-paper p-4 text-body-sm text-ink">
          <p className="font-semibold">Ce dossier a déjà été instruit.</p>
          {grant.montantAccorde && <p>Montant accordé : <strong>{formatGrantAmount(grant.montantAccorde)}</strong></p>}
          {grant.observations && <p className="whitespace-pre-wrap text-muted">{grant.observations}</p>}
        </div>
      )}
    </aside>
  );
}
