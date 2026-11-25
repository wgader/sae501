'use client';

import { useEffect, useState, type FormEvent } from 'react';
import SettingsCard from '@/components/admin/settings/SettingsCard';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import Notice from '@/components/ui/Notice';
import { IconArrowRight, IconPlus } from '@/components/ui/icons';
import { getAdminLegal, updateAdminLegal } from '@/lib/api';
import type { LegalContent, LegalSection } from '@/lib/api/types';
import { cn } from '@/lib/utils';
import { formFieldInputVariants, formFieldLabelVariants } from '@/components/ui/FormField';
import { formatLegalSectionTitle } from '@/lib/legal';

type Feedback = { tone: 'success' | 'danger'; message: string } | null;

export default function LegalSettingsPanel() {
  const [activeType, setActiveType] = useState<'cgu' | 'mentions_legales'>('cgu');
  const [legalData, setLegalData] = useState<LegalContent | null>(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [sections, setSections] = useState<LegalSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  // Modale ajout / modification d'un article/section
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [sectionTitle, setSectionTitle] = useState('');
  const [sectionText, setSectionText] = useState('');

  const reloadCurrentData = async (type: 'cgu' | 'mentions_legales') => {
    try {
      setLoading(true);
      const data = await getAdminLegal(type);
      setLegalData(data);
      setTitle(data.title);
      setSubtitle(data.subtitle ?? '');
      setLastUpdated(data.lastUpdated ?? '');
      setSections(data.sections ?? []);
    } catch {
      setFeedback({ tone: 'danger', message: 'Erreur lors du chargement des informations légales.' });
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    let active = true;
    getAdminLegal(activeType)
      .then((data) => {
        if (active) {
          setLegalData(data);
          setTitle(data.title);
          setSubtitle(data.subtitle ?? '');
          setLastUpdated(data.lastUpdated ?? '');
          setSections(data.sections ?? []);
        }
      })
      .catch(() => {
        if (active) setFeedback({ tone: 'danger', message: 'Erreur lors du chargement des informations légales.' });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [activeType]);


  const handleSaveMeta = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setSaving(true);
      const updated = await updateAdminLegal(activeType, {
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        lastUpdated: lastUpdated.trim() || null,
        sections,
      });
      setLegalData(updated);
      setFeedback({ tone: 'success', message: 'Page enregistrée avec succès.' });
      void reloadCurrentData(activeType);
    } catch (err: unknown) {

      setFeedback({ tone: 'danger', message: err instanceof Error ? err.message : 'Erreur lors de l’enregistrement.' });
    } finally {
      setSaving(false);
    }
  };

  const openAddSection = () => {
    setEditingIndex(null);
    setSectionTitle('');
    setSectionText('');
    setIsSectionModalOpen(true);
  };

  const openEditSection = (index: number) => {
    setEditingIndex(index);
    setSectionTitle(sections[index].title);
    setSectionText(sections[index].text);
    setIsSectionModalOpen(true);
  };

  const handleSaveSection = (e: FormEvent) => {
    e.preventDefault();
    if (!sectionTitle.trim() || !sectionText.trim()) return;

    const nextSections = [...sections];
    if (editingIndex !== null) {
      nextSections[editingIndex] = { title: sectionTitle.trim(), text: sectionText.trim() };
    } else {
      nextSections.push({ title: sectionTitle.trim(), text: sectionText.trim() });
    }
    setSections(nextSections);
    setIsSectionModalOpen(false);
  };

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const nextSections = [...sections];
    [nextSections[index], nextSections[targetIndex]] = [nextSections[targetIndex], nextSections[index]];
    setSections(nextSections);
  };

  return (
    <div className="space-y-8">
      {feedback && <Notice tone={feedback.tone}>{feedback.message}</Notice>}

      <div className="flex gap-2 border-b border-line pb-4">
        <button
          type="button"
          onClick={() => setActiveType('cgu')}
          className={`rounded-soft px-4 py-2 text-sm font-bold transition-colors ${
            activeType === 'cgu' ? 'bg-primary text-white shadow-xs' : 'bg-paper text-muted hover:text-ink'
          }`}
        >
          Conditions Générales d&apos;Utilisation (CGU)
        </button>
        <button
          type="button"
          onClick={() => setActiveType('mentions_legales')}
          className={`rounded-soft px-4 py-2 text-sm font-bold transition-colors ${
            activeType === 'mentions_legales' ? 'bg-primary text-white shadow-xs' : 'bg-paper text-muted hover:text-ink'
          }`}
        >
          Mentions Légales
        </button>
      </div>

      <SettingsCard
        title={activeType === 'cgu' ? 'Édition des CGU' : 'Édition des Mentions Légales'}
        description={`Modifiez les textes officiels affichés aux utilisateurs sur la page ${
          activeType === 'cgu' ? '/cgu et la modale d’inscription' : '/mentions-legales'
        }.`}
      >
        {loading ? (
          <p className="py-6 text-center text-sm text-muted">Chargement…</p>
        ) : (
          <form onSubmit={(e) => void handleSaveMeta(e)} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={formFieldLabelVariants()}>
                <span>Titre principal</span>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={cn(formFieldInputVariants(), 'w-full')}
                />
              </label>
              <label className={formFieldLabelVariants()}>
                <span>Sous-titre / Catégorie</span>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className={cn(formFieldInputVariants(), 'w-full')}
                />
              </label>
            </div>

            <label className={formFieldLabelVariants()}>
              <span>Date ou libellé de mise à jour</span>
              <input
                type="text"
                value={lastUpdated}
                onChange={(e) => setLastUpdated(e.target.value)}
                placeholder="Ex : 23 novembre 2026"
                className={cn(formFieldInputVariants(), 'w-full max-w-sm')}
              />
            </label>

            <div className="border-t border-line pt-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-ink">Articles et paragraphes</h4>
                  <p className="text-xs text-muted">
                    Déplacez les sections pour choisir leur ordre ; leur numérotation suivra automatiquement.
                  </p>
                </div>
                <Button type="button" onClick={openAddSection} className="gap-2 text-xs" rightIcon={<IconPlus className="h-4 w-4" />}>
                  Ajouter une section
                </Button>
              </div>

              {sections.length === 0 ? (
                <p className="rounded-soft border border-dashed border-line bg-paper p-6 text-center text-sm text-muted">
                  Aucune section. Cliquez sur &quot;Ajouter une section&quot; pour commencer.
                </p>
              ) : (
                <div className="divide-y divide-line rounded-soft border border-line bg-white">
                  {sections.map((sec, idx) => (
                    <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1 min-w-0 flex-1">
                        <h5 className="font-bold text-sm text-ink">{formatLegalSectionTitle(sec.title, idx)}</h5>
                        <p className="whitespace-pre-line text-xs text-muted leading-relaxed line-clamp-3">
                          {sec.text}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-0">
                          <button
                            type="button"
                            onClick={() => moveSection(idx, -1)}
                            disabled={idx === 0}
                            aria-label={`Déplacer « ${formatLegalSectionTitle(sec.title, idx)} » vers le haut`}
                            className="p-1 text-muted transition-colors hover:text-primary focus-visible:rounded-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <IconArrowRight className="-rotate-90 h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveSection(idx, 1)}
                            disabled={idx === sections.length - 1}
                            aria-label={`Déplacer « ${formatLegalSectionTitle(sec.title, idx)} » vers le bas`}
                            className="p-1 text-muted transition-colors hover:text-primary focus-visible:rounded-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <IconArrowRight className="rotate-90 h-4 w-4" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => openEditSection(idx)}
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSection(idx)}
                          className="text-xs font-semibold text-danger hover:underline ml-2"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {legalData?.updatedAt && (
              <p className="text-xs text-muted italic">
                Dernière modification enregistrée le {new Date(legalData.updatedAt).toLocaleDateString('fr-FR')}
                {legalData.updatedBy ? ` par ${legalData.updatedBy}` : ''}.
              </p>
            )}

            <div className="flex justify-end pt-4">
              <Button type="submit" isLoading={saving}>
                Enregistrer les modifications
              </Button>
            </div>
          </form>
        )}
      </SettingsCard>

      {/* Modale d'ajout ou modification d'une section */}
      <Dialog
        open={isSectionModalOpen}
        onClose={() => setIsSectionModalOpen(false)}
        title={editingIndex !== null ? 'Modifier la section' : 'Ajouter une section'}
      >
        <form onSubmit={handleSaveSection} className="space-y-4 pt-2">
          <label className={formFieldLabelVariants()}>
            <span>Titre de l&apos;article ou section</span>
            <input
              type="text"
              required
              value={sectionTitle}
              onChange={(e) => setSectionTitle(e.target.value)}
              placeholder="Ex. Objet (la numérotation suit automatiquement l’ordre des sections)"
              className={cn(formFieldInputVariants(), 'w-full')}
            />
          </label>
          <label className={formFieldLabelVariants()}>
            <span>Contenu</span>
            <textarea
              required
              rows={6}
              value={sectionText}
              onChange={(e) => setSectionText(e.target.value)}
              placeholder="Texte complet de la clause ou des dispositions légales..."
              className={cn(formFieldInputVariants(), 'w-full resize-y')}
            />
          </label>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" type="button" onClick={() => setIsSectionModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit">Valider</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
