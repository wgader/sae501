'use client';

import { useCallback, useState, useSyncExternalStore } from 'react';

const noSubscription = () => () => {};

/**
 * Affichage choisi (liste, cartes…), retenu dans le navigateur pour la prochaine visite.
 * Le stockage peut être indisponible (navigation privée) : on garde alors la valeur par défaut.
 */
export function useStoredView<T extends string>(key: string, options: readonly T[], fallback: T) {
  const stored = useSyncExternalStore(
    noSubscription,
    () => {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    () => null,
  );
  const [chosen, setChosen] = useState<T | null>(null);
  const view = chosen ?? (options.includes(stored as T) ? (stored as T) : fallback);

  const setView = useCallback((next: T) => {
    setChosen(next);
    try {
      window.localStorage.setItem(key, next);
    } catch {
      // Rien à faire : le choix vaut pour la page en cours.
    }
  }, [key]);

  return [view, setView] as const;
}
