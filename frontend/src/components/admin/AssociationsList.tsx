'use client';

import { useState } from 'react';
import {
  type Association,
  type AssociationStatus,
} from '@/lib/api';
import { useAssociations } from '@/hooks/useAssociations';

const STATUS_LABELS: Record<AssociationStatus, string> = {
  PENDING_VALIDATION: 'En attente',
  VALIDATED: 'Validée',
  REFUSED: 'Refusée',
};

export default function AssociationsList() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<AssociationStatus | ''>('');
  const { associations, totalItems, loading, error, updatingId, updateStatus } = useAssociations(page, status);
  const totalPages = Math.max(1, Math.ceil(totalItems / 10));

  async function validateAssociation(association: Association) {
    if (!window.confirm(`Valider l’association « ${association.nom} » avec tous les modules ?`)) return;
    await updateStatus(association, 'VALIDATED');
  }

  async function refuseAssociation(association: Association) {
    if (!window.confirm(`Refuser l’association « ${association.nom} » ?`)) return;
    await updateStatus(association, 'REFUSED');
  }

  async function restoreAssociation(association: Association) {
    if (!window.confirm(`Remettre l’association « ${association.nom} » en attente ?`)) return;
    await updateStatus(association, 'PENDING_VALIDATION');
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Associations</h2>
          <p className="text-sm text-slate-500">Validez les demandes. Toutes les associations disposent des trois modules.</p>
        </div>
        <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
          Filtrer
          <select
            value={status}
            onChange={(event) => { setStatus(event.target.value as AssociationStatus | ''); setPage(1); }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
          >
            <option value="">Tous les statuts</option>
            <option value="PENDING_VALIDATION">En attente</option>
            <option value="VALIDATED">Validées</option>
            <option value="REFUSED">Refusées</option>
          </select>
        </label>
      </div>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Association</th>
                <th className="px-5 py-4 font-semibold">RNA</th>
                <th className="px-5 py-4 font-semibold">Statut</th>
                <th className="px-5 py-4 font-semibold">Modules</th>
                <th className="px-5 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500">Chargement des associations…</td></tr>
              ) : associations.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500">Aucune association trouvée.</td></tr>
              ) : associations.map((association) => (
                <tr key={association.id} className="transition hover:bg-slate-50/70">
                  <td className="px-5 py-4 font-medium text-slate-900">{association.nom}</td>
                  <td className="px-5 py-4 text-slate-600">{association.numeroRna}</td>
                  <td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${association.statut === 'VALIDATED' ? 'bg-emerald-100 text-emerald-700' : association.statut === 'REFUSED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{STATUS_LABELS[association.statut]}</span></td>
                  <td className="px-5 py-4 text-slate-600">{association.permissions.length ? association.permissions.join(', ') : '—'}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {association.statut === 'PENDING_VALIDATION' && (
                        <button disabled={updatingId !== null} onClick={() => void validateAssociation(association)} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">Valider</button>
                      )}
                      {association.statut === 'REFUSED' && (
                        <button disabled={updatingId !== null} onClick={() => void restoreAssociation(association)} className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-50">Remettre en attente</button>
                      )}
                      {association.statut === 'PENDING_VALIDATION' && (
                        <button disabled={updatingId !== null} onClick={() => void refuseAssociation(association)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">Refuser</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalItems > 0 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>{totalItems} association{totalItems > 1 ? 's' : ''}</span>
          <div className="flex items-center gap-3">
            <button disabled={page === 1} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-slate-300 px-3 py-2 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Précédent</button>
            <span>Page {page} sur {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-slate-300 px-3 py-2 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Suivant</button>
          </div>
        </div>
      )}

    </section>
  );
}
