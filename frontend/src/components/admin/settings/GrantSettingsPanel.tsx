'use client';

import { useEffect, useState, type FormEvent } from 'react';
import SettingsCard from '@/components/admin/settings/SettingsCard';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import Notice from '@/components/ui/Notice';
import { IconDownload, IconPlus } from '@/components/ui/icons';
import {
  createAdminGrantDocumentType,
  createAdminGrantResource,
  deleteAdminGrantDocumentType,
  deleteAdminGrantResource,
  getAdminGrantDocumentTypes,
  getAdminGrantResources,
  updateAdminGrantDocumentType,
} from '@/lib/api';

import type { GrantDocumentType, GrantResource } from '@/lib/api/types';
import { cn } from '@/lib/utils';
import { formFieldInputVariants, formFieldLabelVariants } from '@/components/ui/FormField';

type Feedback = { tone: 'success' | 'danger'; message: string } | null;

export default function GrantSettingsPanel() {
  const [docTypes, setDocTypes] = useState<GrantDocumentType[]>([]);
  const [resources, setResources] = useState<GrantResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback>(null);

  // Modale nouveau type de document
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [typeLabel, setTypeLabel] = useState('');
  const [typeRequired, setTypeRequired] = useState(false);

  // Modale nouvelle ressource / modèle
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [resourceLabel, setResourceLabel] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [resourceExternal, setResourceExternal] = useState(false);

  // Suppression
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'doc' | 'res'; id: number; label: string } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedTypes, fetchedResources] = await Promise.all([
        getAdminGrantDocumentTypes(),
        getAdminGrantResources(),
      ]);
      setDocTypes(fetchedTypes);
      setResources(fetchedResources);
    } catch {
      setFeedback({ tone: 'danger', message: 'Erreur lors du chargement des paramètres de subvention.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([getAdminGrantDocumentTypes(), getAdminGrantResources()])
      .then(([fetchedTypes, fetchedResources]) => {
        if (active) {
          setDocTypes(fetchedTypes);
          setResources(fetchedResources);
        }
      })
      .catch(() => {
        if (active) setFeedback({ tone: 'danger', message: 'Erreur lors du chargement des paramètres de subvention.' });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);


  const handleAddType = async (e: FormEvent) => {
    e.preventDefault();
    if (!typeLabel.trim()) return;
    try {
      await createAdminGrantDocumentType({
        label: typeLabel.trim(),
        isRequired: typeRequired,
        displayOrder: docTypes.length + 1,
      });
      setTypeLabel('');
      setTypeRequired(false);
      setIsTypeModalOpen(false);
      setFeedback({ tone: 'success', message: 'Type de document requis ajouté.' });
      void loadData();
    } catch (err: unknown) {
      setFeedback({ tone: 'danger', message: err instanceof Error ? err.message : 'Erreur lors de l’ajout.' });
    }
  };

  const handleAddResource = async (e: FormEvent) => {
    e.preventDefault();
    if (!resourceLabel.trim() || !resourceUrl.trim()) return;
    try {
      await createAdminGrantResource({
        label: resourceLabel.trim(),
        url: resourceUrl.trim(),
        isExternal: resourceExternal,
        displayOrder: resources.length + 1,
      });
      setResourceLabel('');
      setResourceUrl('');
      setResourceExternal(false);
      setIsResourceModalOpen(false);
      setFeedback({ tone: 'success', message: 'Fichier ressource ajouté avec succès.' });
      void loadData();
    } catch (err: unknown) {
      setFeedback({ tone: 'danger', message: err instanceof Error ? err.message : 'Erreur lors de l’ajout.' });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'doc') {
        await deleteAdminGrantDocumentType(deleteTarget.id);
        setFeedback({ tone: 'success', message: 'Type de document supprimé.' });
      } else {
        await deleteAdminGrantResource(deleteTarget.id);
        setFeedback({ tone: 'success', message: 'Ressource supprimée.' });
      }
      setDeleteTarget(null);
      void loadData();
    } catch (err: unknown) {
      setFeedback({ tone: 'danger', message: err instanceof Error ? err.message : 'Erreur lors de la suppression.' });
    }
  };

  const toggleTypeRequired = async (type: GrantDocumentType) => {
    try {
      await updateAdminGrantDocumentType(type.id, { isRequired: !type.isRequired });
      void loadData();
    } catch {
      setFeedback({ tone: 'danger', message: 'Impossible de mettre à jour le statut.' });
    }
  };

  return (
    <div className="space-y-8">
      {feedback && <Notice tone={feedback.tone}>{feedback.message}</Notice>}

      {/* 1. Types de pièces justificatives demandées */}
      <SettingsCard
        title="Pièces justificatives requises"
        description="Liste des types de documents que les associations peuvent ou doivent joindre lors de leur dépôt de subvention."
      >
        <div className="mb-4 flex justify-between items-center">
          <p className="text-sm text-muted">Ces types apparaissent dans le menu déroulant du formulaire de dépôt.</p>
          <Button onClick={() => setIsTypeModalOpen(true)} className="gap-2 text-xs" rightIcon={<IconPlus className="h-4 w-4" />}>
            Ajouter un type
          </Button>
        </div>

        {loading ? (
          <p className="py-6 text-center text-sm text-muted">Chargement…</p>
        ) : (
          <div className="divide-y divide-line rounded-soft border border-line bg-white">
            {docTypes.map((type) => (
              <div key={type.id} className="flex items-center justify-between p-4 gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-ink">{type.label}</span>
                    {type.isRequired ? (
                      <span className="rounded-pill bg-primary/10 px-2.5 py-0.5 text-label font-bold text-primary">
                        Requis
                      </span>
                    ) : (
                      <span className="rounded-pill bg-paper px-2.5 py-0.5 text-label font-bold text-muted">
                        Optionnel
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void toggleTypeRequired(type)}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    {type.isRequired ? 'Rendre optionnel' : 'Rendre requis'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget({ type: 'doc', id: type.id, label: type.label })}
                    className="text-xs font-semibold text-danger hover:underline ml-2"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SettingsCard>

      {/* 2. Modèles et documents ressources mis à disposition */}
      <SettingsCard
        title="Modèles et documents en téléchargement"
        description="Fichiers modèles (Cerfa, notice, contrats, liens) mis à disposition des associations dans l'encadré d'aide."
      >
        <div className="mb-4 flex justify-between items-center">
          <p className="text-sm text-muted">Affichés directement dans la colonne de droite de la démarche de subvention.</p>
          <Button onClick={() => setIsResourceModalOpen(true)} className="gap-2 text-xs" rightIcon={<IconPlus className="h-4 w-4" />}>
            Ajouter un document
          </Button>
        </div>

        {loading ? (
          <p className="py-6 text-center text-sm text-muted">Chargement…</p>
        ) : (
          <div className="divide-y divide-line rounded-soft border border-line bg-white">
            {resources.map((res) => (
              <div key={res.id} className="flex items-center justify-between p-4 gap-4">
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-ink block">{res.label}</span>
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-muted hover:text-primary flex items-center gap-1 mt-0.5 truncate"
                  >
                    <IconDownload className="h-3 w-3 shrink-0" />
                    <span className="truncate">{res.url}</span>
                    {res.isExternal && <span className="text-label text-muted/70">(lien externe)</span>}
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteTarget({ type: 'res', id: res.id, label: res.label })}
                  className="text-xs font-semibold text-danger hover:underline"
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        )}
      </SettingsCard>

      {/* Modale création type document */}
      <Dialog
        open={isTypeModalOpen}
        onClose={() => setIsTypeModalOpen(false)}
        title="Ajouter un type de justificatif"
      >
        <form onSubmit={(e) => void handleAddType(e)} className="space-y-4 pt-2">
          <label className={formFieldLabelVariants()}>
            <span>Intitulé du document</span>
            <input
              type="text"
              required
              value={typeLabel}
              onChange={(e) => setTypeLabel(e.target.value)}
              placeholder="Ex : Attestation d'assurance, Budget prévisionnel..."
              className={cn(formFieldInputVariants(), 'w-full')}
            />
          </label>
          <label className="flex items-center gap-3 pt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={typeRequired}
              onChange={(e) => setTypeRequired(e.target.checked)}
              className="h-4 w-4 rounded border-line text-primary focus:ring-primary"
            />
            <span className="text-sm font-semibold text-ink">Pièce obligatoire pour transmettre le dossier</span>
          </label>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" type="button" onClick={() => setIsTypeModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </Dialog>

      {/* Modale création ressource */}
      <Dialog
        open={isResourceModalOpen}
        onClose={() => setIsResourceModalOpen(false)}
        title="Ajouter un document modèle ou ressource"
      >
        <form onSubmit={(e) => void handleAddResource(e)} className="space-y-4 pt-2">
          <label className={formFieldLabelVariants()}>
            <span>Titre affiché pour le document</span>
            <input
              type="text"
              required
              value={resourceLabel}
              onChange={(e) => setResourceLabel(e.target.value)}
              placeholder="Ex : Cerfa N° 12156*06, Notice d'utilisation..."
              className={cn(formFieldInputVariants(), 'w-full')}
            />
          </label>
          <label className={formFieldLabelVariants()}>
            <span>Lien ou chemin du fichier</span>
            <input
              type="text"
              required
              value={resourceUrl}
              onChange={(e) => setResourceUrl(e.target.value)}
              placeholder="Ex : /assets/mon-formulaire.pdf ou https://..."
              className={cn(formFieldInputVariants(), 'w-full')}
            />
          </label>
          <label className="flex items-center gap-3 pt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={resourceExternal}
              onChange={(e) => setResourceExternal(e.target.checked)}
              className="h-4 w-4 rounded border-line text-primary focus:ring-primary"
            />
            <span className="text-sm font-semibold text-ink">Lien externe (s&apos;ouvre dans un nouvel onglet)</span>
          </label>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" type="button" onClick={() => setIsResourceModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </Dialog>

      {/* Modale confirmation suppression */}
      <Dialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Confirmer la suppression"
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm text-ink">
            Voulez-vous vraiment supprimer « <strong>{deleteTarget?.label}</strong> » ?
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={() => void confirmDelete()}>
              Supprimer
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
