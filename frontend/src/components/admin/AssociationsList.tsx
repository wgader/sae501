'use client';

import { useState } from 'react';
import {
  type Association,
  type AssociationModule,
  type AssociationStatus,
} from '@/lib/api';
import { useAssociations } from '@/hooks/useAssociations';

const MODULES: { value: AssociationModule; label: string }[] = [
  { value: 'subventions', label: 'Subventions' },
  { value: 'materiel', label: 'Matériel' },
  { value: 'salles', label: 'Salles' },
];

const STATUS_LABELS: Record<AssociationStatus, string> = {
  PENDING_VALIDATION: 'En attente',
  VALIDATED: 'Validée',
  REFUSED: 'Refusée',
};

export default function AssociationsList() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<AssociationStatus | ''>('');
  const [selectedAssociation, setSelectedAssociation] = useState<Association | null>(null);
  const [selectedModules, setSelectedModules] = useState<AssociationModule[]>([]);
  const [modalError, setModalError] = useState('');
  const { associations, totalItems, loading, error, updatingId, updateStatus } = useAssociations(page, status);
  const totalPages = Math.max(1, Math.ceil(totalItems / 10));

  function openModules(association: Association) {
    setSelectedAssociation(association);
    setSelectedModules(association.permissions);
    setModalError('');
  }

  async function saveModules() {
    if (!selectedAssociation) return;
    if (selectedAssociation.statut === 'PENDING_VALIDATION' && selectedModules.length === 0) {
      setModalError('Sélectionnez au moins un module.');
      return;
    }
    try {
      const nextStatus = selectedAssociation.statut === 'PENDING_VALIDATION'
        ? 'VALIDATED'
        : selectedAssociation.statut;
      await updateStatus(selectedAssociation, nextStatus, selectedModules);
      setSelectedAssociation(null);
    } catch {
      setModalError('La validation n’a pas pu être enregistrée.');
    }
  }

  async function refuseAssociation(association: Association) {
    if (!window.confirm(`Refuser l’association « ${association.nom} » ?`)) return;
    await updateStatus(association, 'REFUSED', []);
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Associations</h2>
          <p className="text-sm text-slate-500">Validez les demandes et gérez les modules accessibles.</p>
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
                        <button disabled={updatingId !== null} onClick={() => openModules(association)} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">Valider</button>
                      )}
                      {association.statut !== 'PENDING_VALIDATION' && (
                        <button disabled={updatingId !== null} onClick={() => openModules(association)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Modifier</button>
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

      {selectedAssociation && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              {selectedAssociation.statut === 'PENDING_VALIDATION' ? 'Valider' : 'Modifier les modules'} {selectedAssociation.nom}
            </h3>
            <p className="mt-1 text-sm text-slate-500">Choisissez les modules accessibles à cette association.</p>
            <div className="mt-5 space-y-3">
              {MODULES.map((module) => (
                <label key={module.value} className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm text-slate-700 hover:bg-slate-50">
                  <input type="checkbox" checked={selectedModules.includes(module.value)} onChange={(event) => setSelectedModules((current) => event.target.checked ? [...current, module.value] : current.filter((item) => item !== module.value))} className="h-4 w-4 accent-slate-900" />
                  {module.label}
                </label>
              ))}
            </div>
            {modalError && <p className="mt-4 text-sm text-red-600" role="alert">{modalError}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setSelectedAssociation(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Annuler</button>
              <button disabled={updatingId !== null} onClick={() => void saveModules()} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
