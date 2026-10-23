'use client';

import { useState, type FormEvent } from 'react';
import {
  ApiError,
  checkEquipmentStock,
  Equipment,
  getEquipmentStockAdjustments,
  StockAdjustment,
  StockCheckResult,
  updateAdminEquipment,
} from '@/lib/api';

interface EquipmentStockModalProps {
  equipment: Equipment;
  onClose: () => void;
  onSaved: (equipment: Equipment) => void;
  onError: (message: string) => void;
}

export default function EquipmentStockModal({
  equipment,
  onClose,
  onSaved,
  onError,
}: EquipmentStockModalProps) {
  const [reason, setReason] = useState('Entrée de stock');
  const [newStock, setNewStock] = useState<number | ''>(equipment.stockTotal);
  const [checking, setChecking] = useState(false);
  const [conflict, setConflict] = useState<StockCheckResult | null>(null);
  const [forceConfirm, setForceConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<StockAdjustment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);

  const handleStockInputChange = async (value: string) => {
    const nextStock = value === '' ? '' : Number(value);
    setNewStock(nextStock);
    setConflict(null);
    setForceConfirm(false);
    setError(null);

    if (nextStock === '' || !Number.isInteger(nextStock) || nextStock < 0) {
      return;
    }

    if (nextStock >= equipment.stockTotal) {
      return;
    }

    setChecking(true);
    try {
      const result = await checkEquipmentStock(equipment.id, nextStock);
      if (result.hasConflict) {
        setConflict(result);
      }
    } catch (checkError) {
      console.error('Erreur lors de la vérification de stock:', checkError);
      setError('La vérification des réservations a échoué. Réessayez avant de valider.');
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      newStock === '' ||
      !Number.isInteger(Number(newStock)) ||
      Number(newStock) < 0
    ) {
      setError('Le stock doit être un entier positif ou nul.');
      return;
    }

    if (conflict?.hasConflict && !forceConfirm) {
      setError('Veuillez confirmer explicitement la réduction de stock malgré le conflit de réservations.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const updated = await updateAdminEquipment(equipment.id, {
        stockTotal: Number(newStock),
        reason,
        force: forceConfirm,
      });
      onSaved(updated);
    } catch (updateError) {
      if (updateError instanceof ApiError && updateError.status === 409) {
        const conflictData = updateError.data;
        if (isStockCheckResult(conflictData)) {
          setConflict(conflictData);
        }
        setError(updateError.message);
      } else {
        onError(
          updateError instanceof Error
            ? updateError.message
            : 'Erreur lors de la mise à jour du stock.',
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleHistoryToggle = async () => {
    if (historyVisible) {
      setHistoryVisible(false);
      return;
    }

    setHistoryVisible(true);
    if (history.length > 0) return;

    setHistoryLoading(true);
    try {
      setHistory(await getEquipmentStockAdjustments(equipment.id));
    } catch (historyError) {
      console.error('Erreur lors du chargement de l’historique de stock:', historyError);
      setError('Impossible de charger l’historique des ajustements.');
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="equipment-stock-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-panel bg-white p-6 shadow-panel"
      >
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div>
            <h2 id="equipment-stock-title" className="text-lg font-bold text-ink">
              Ajuster le stock
            </h2>
            <p className="text-xs text-muted">{equipment.designation}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer l’ajustement de stock"
            className="rounded-control p-1 text-muted hover:bg-paper"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="flex items-center justify-between rounded-control bg-paper p-3 text-xs">
            <span className="font-semibold text-muted">Stock actuel de référence :</span>
            <span className="text-base font-black text-ink">{equipment.stockTotal} unités</span>
          </div>

          <div>
            <button
              type="button"
              onClick={() => void handleHistoryToggle()}
              className="text-xs font-bold text-primary underline-offset-2 hover:underline"
            >
              {historyVisible ? 'Masquer l’historique' : 'Afficher l’historique des ajustements'}
            </button>
            {historyVisible && (
              <div className="mt-3 rounded-control border border-line bg-paper p-3">
                {historyLoading ? (
                  <p className="text-xs text-muted" role="status">Chargement de l’historique...</p>
                ) : history.length === 0 ? (
                  <p className="text-xs text-muted">Aucun ajustement enregistré.</p>
                ) : (
                  <ol className="space-y-2">
                    {history.map((adjustment) => (
                      <li key={adjustment.id} className="border-b border-line pb-2 text-xs last:border-0 last:pb-0">
                        <p className="font-bold text-ink">
                          {adjustment.previousStock} → {adjustment.newStock} unités · {adjustment.reason}
                        </p>
                        <p className="text-muted">
                          {new Date(adjustment.createdAt).toLocaleString('fr-FR')} ·{' '}
                          {adjustment.agent.prenom} {adjustment.agent.nom}
                        </p>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="stock-adjustment-reason" className="block text-xs font-bold uppercase tracking-wider text-muted">
              Motif de l&apos;ajustement
            </label>
            <select
              id="stock-adjustment-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="mt-1.5 w-full rounded-control border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-primary focus:bg-white focus:outline-none"
            >
              <option value="Entrée de stock">Entrée de stock (nouvel achat communal)</option>
              <option value="Casse">Casse constatée</option>
              <option value="Perte">Perte / Vol</option>
              <option value="Maintenance">Maintenance / Réparation temporaire</option>
              <option value="Autre">Autre ajustement d&apos;inventaire</option>
            </select>
          </div>

          <div>
            <label htmlFor="new-equipment-stock" className="block text-xs font-bold uppercase tracking-wider text-muted">
              Nouveau stock total <span className="text-danger">*</span>
            </label>
            <input
              id="new-equipment-stock"
              type="number"
              min="0"
              step="1"
              required
              value={newStock}
              disabled={checking || submitting}
              aria-describedby={checking ? 'stock-check-status' : undefined}
              onChange={(event) => void handleStockInputChange(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-line bg-paper px-3.5 py-2 text-sm text-ink focus:border-primary focus:bg-white focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            />
            {checking && (
              <p id="stock-check-status" className="mt-1 text-xs text-muted" role="status">
                Vérification de cohérence avec les réservations...
              </p>
            )}
          </div>

          {conflict?.hasConflict && (
            <div className="space-y-2 rounded-xl border border-red-300 bg-red-50 p-4 text-xs text-danger">
              <div className="flex items-center gap-2 text-sm font-black">
                <span aria-hidden="true">⚠</span>
                Avertissement de surbooking
              </div>
              <p className="leading-relaxed">
                Le stock demandé ({newStock}) est inférieur aux réservations fermes validées
                (jusqu&apos;à {conflict.maxBooked} unités réservées).
              </p>
              <div className="space-y-1 rounded-lg bg-white/70 p-2 text-meta">
                <p className="font-bold text-ink">Réservations compromises :</p>
                <ul className="list-disc space-y-0.5 pl-4">
                  {conflict.conflictingReservations.map((reservation) => (
                    <li key={reservation.id}>
                      <strong>{reservation.association}</strong> : {reservation.motif} (
                      {reservation.quantite} unités demandées du{' '}
                      {new Date(reservation.dateRetrait).toLocaleDateString('fr-FR')} au{' '}
                      {new Date(reservation.dateRestitution).toLocaleDateString('fr-FR')})
                    </li>
                  ))}
                </ul>
              </div>

              <label className="flex cursor-pointer items-start gap-2 pt-2 font-bold text-ink">
                <input
                  type="checkbox"
                  checked={forceConfirm}
                  onChange={(event) => setForceConfirm(event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-red-300 text-danger focus:ring-red-400"
                />
                <span>Je confirme explicitement cet ajustement malgré le risque de surbooking.</span>
              </label>
            </div>
          )}

          {error && (
            <p className="text-xs font-semibold text-danger" role="alert">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-line pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-line px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted hover:bg-paper"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || checking}
              className="rounded-xl bg-primary px-5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {submitting ? 'Mise à jour...' : 'Valider le nouveau stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function isStockCheckResult(data: unknown): data is StockCheckResult {
  return (
    typeof data === 'object' &&
    data !== null &&
    'hasConflict' in data &&
    'conflictingReservations' in data &&
    Array.isArray(data.conflictingReservations)
  );
}
