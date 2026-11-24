'use client';

import { useEffect, useState, type FormEvent } from 'react';
import SettingsCard from '@/components/admin/settings/SettingsCard';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import Notice from '@/components/ui/Notice';
import { IconPlus } from '@/components/ui/icons';
import {
  createAdminFaq,
  deleteAdminFaq,
  getAdminFaq,
  updateAdminFaq,
} from '@/lib/api';
import type { FaqItem } from '@/lib/api/types';
import { cn } from '@/lib/utils';
import { formFieldInputVariants, formFieldLabelVariants } from '@/components/ui/FormField';

type Feedback = { tone: 'success' | 'danger'; message: string } | null;

export default function FaqSettingsPanel() {
  const [faqItems, setFaqItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback>(null);

  // Modale édition / création
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FaqItem | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  // Modale suppression
  const [deleteTarget, setDeleteTarget] = useState<FaqItem | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getAdminFaq();
      setFaqItems(data);
    } catch {
      setFeedback({ tone: 'danger', message: 'Erreur lors du chargement des questions de la FAQ.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    getAdminFaq()
      .then((data) => {
        if (active) setFaqItems(data);
      })
      .catch(() => {
        if (active) setFeedback({ tone: 'danger', message: 'Erreur lors du chargement des questions de la FAQ.' });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);


  const openCreateModal = () => {
    setEditingItem(null);
    setQuestion('');
    setAnswer('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: FaqItem) => {
    setEditingItem(item);
    setQuestion(item.question);
    setAnswer(item.answer);
    setIsModalOpen(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;

    try {
      if (editingItem) {
        await updateAdminFaq(editingItem.id, {
          question: question.trim(),
          answer: answer.trim(),
        });
        setFeedback({ tone: 'success', message: 'Question mise à jour avec succès.' });
      } else {
        await createAdminFaq({
          question: question.trim(),
          answer: answer.trim(),
          displayOrder: faqItems.length + 1,
        });
        setFeedback({ tone: 'success', message: 'Nouvelle question ajoutée à la FAQ.' });
      }
      setIsModalOpen(false);
      void loadData();
    } catch (err: unknown) {
      setFeedback({ tone: 'danger', message: err instanceof Error ? err.message : 'Erreur lors de l’enregistrement.' });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAdminFaq(deleteTarget.id);
      setFeedback({ tone: 'success', message: 'Question supprimée de la FAQ.' });
      setDeleteTarget(null);
      void loadData();
    } catch (err: unknown) {
      setFeedback({ tone: 'danger', message: err instanceof Error ? err.message : 'Erreur lors de la suppression.' });
    }
  };

  return (
    <div className="space-y-8">
      {feedback && <Notice tone={feedback.tone}>{feedback.message}</Notice>}

      <SettingsCard
        title="Foire Aux Questions (FAQ)"
        description="Gérez les questions et réponses présentées aux associations et au public sur la page d'accueil."
      >
        <div className="mb-4 flex justify-between items-center">
          <p className="text-sm text-muted">Ces questions sont visibles par tous les visiteurs sur le portail d&apos;accueil.</p>
          <Button onClick={openCreateModal} className="gap-2 text-xs" rightIcon={<IconPlus className="h-4 w-4" />}>
            Ajouter une question
          </Button>
        </div>

        {loading ? (
          <p className="py-6 text-center text-sm text-muted">Chargement…</p>
        ) : faqItems.length === 0 ? (
          <p className="rounded-soft border border-dashed border-line bg-paper p-6 text-center text-sm text-muted">
            Aucune question configurée pour le moment.
          </p>
        ) : (
          <div className="divide-y divide-line rounded-soft border border-line bg-white">
            {faqItems.map((item) => (
              <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1 min-w-0 flex-1">
                  <h4 className="font-bold text-ink text-sm">{item.question}</h4>
                  <p className="text-xs text-muted leading-relaxed line-clamp-3">{item.answer}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(item)}
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

      {/* Modale d'ajout ou modification */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Modifier la question' : 'Ajouter une question'}
      >
        <form onSubmit={(e) => void handleSave(e)} className="space-y-4 pt-2">
          <label className={formFieldLabelVariants()}>
            <span>Question</span>
            <input
              type="text"
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ex : Qui peut créer un compte ?"
              className={cn(formFieldInputVariants(), 'w-full')}
            />
          </label>
          <label className={formFieldLabelVariants()}>
            <span>Réponse</span>
            <textarea
              required
              rows={4}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Rédigez ici la réponse claire et concise..."
              className={cn(formFieldInputVariants(), 'w-full resize-y')}
            />
          </label>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
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
        title="Supprimer la question"
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm text-ink">
            Voulez-vous vraiment supprimer la question « <strong>{deleteTarget?.question}</strong> » ?
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
