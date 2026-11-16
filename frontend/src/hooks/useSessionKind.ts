'use client';

import { useSyncExternalStore } from 'react';
import { readSession, subscribeSession, type SessionKind } from '@/lib/session';

/**
 * Espace connecté (association ou mairie), mis à jour à la connexion et à la déconnexion.
 * Vaut undefined pendant le rendu serveur, quand la session n'est pas encore connue.
 */
export function useSessionKind(): SessionKind | null | undefined {
  return useSyncExternalStore(
    subscribeSession,
    () => readSession()?.kind ?? null,
    () => undefined,
  );
}
