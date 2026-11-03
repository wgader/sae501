'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  type Association,
  type AssociationModule,
  getAssociation,
  updateAssociationStatus,
  updateAssociationModules,
  deleteAssociation,
} from '@/lib/api';

interface AssociationContextValue {
  id: number;
  association: Association | null;
  loading: boolean;
  error: string;
  feedback: string;
  loadData: () => Promise<void>;
  handleToggleModule: (module: AssociationModule, enabled: boolean) => Promise<void>;
  handleSuspend: () => Promise<void>;
  handleDelete: () => Promise<void>;
  setFeedback: (msg: string) => void;
  setError: (msg: string) => void;
}

const AssociationContext = createContext<AssociationContextValue | null>(null);

export function AssociationProvider({ children }: { children: ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const idString = params?.id as string;
  const id = Number(idString);

  const [association, setAssociation] = useState<Association | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const loadData = useCallback(async () => {
    if (!id || Number.isNaN(id)) {
      setError('Identifiant d’association invalide.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await getAssociation(id);
      setAssociation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger la fiche association.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const handleToggleModule = async (module: AssociationModule, enabled: boolean) => {
    if (!association) return;
    setError('');
    const currentPermissions = association.permissions || [];
    const nextPermissions = enabled
      ? [...new Set([...currentPermissions, module])]
      : currentPermissions.filter((m) => m !== module);

    setAssociation((prev) => (prev ? { ...prev, permissions: nextPermissions } : null));

    try {
      const updated = await updateAssociationModules(association.id, nextPermissions);
      setAssociation(updated);
      setFeedback('Droits d’accès mis à jour avec succès.');
    } catch (err) {
      setAssociation((prev) => (prev ? { ...prev, permissions: currentPermissions } : null));
      setError(err instanceof Error ? err.message : 'Impossible de modifier les permissions du module.');
    }
  };

  const handleSuspend = async () => {
    if (!association) return;
    setError('');
    const nextStatus = association.statut === 'SUSPENDED' ? 'VALIDATED' : 'SUSPENDED';
    try {
      const updated = await updateAssociationStatus(association.id, nextStatus, association.permissions);
      setAssociation(updated);
      setFeedback(
        nextStatus === 'SUSPENDED'
          ? 'Le compte de l’association a bien été suspendu.'
          : 'Le compte de l’association a été réactivé avec succès.',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de modifier le statut de l’association.');
    }
  };

  const handleDelete = async () => {
    if (!association) return;
    setError('');
    try {
      await deleteAssociation(association.id);
      router.push('/admin/association');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de supprimer cette association.');
    }
  };

  return (
    <AssociationContext.Provider
      value={{
        id,
        association,
        loading,
        error,
        feedback,
        loadData,
        handleToggleModule,
        handleSuspend,
        handleDelete,
        setFeedback,
        setError,
      }}
    >
      {children}
    </AssociationContext.Provider>
  );
}

export function useAssociationContext(): AssociationContextValue {
  const context = useContext(AssociationContext);
  if (!context) {
    throw new Error('useAssociationContext must be used within an AssociationProvider');
  }
  return context;
}
