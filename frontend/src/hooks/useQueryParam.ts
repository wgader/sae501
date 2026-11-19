'use client';

import { useSearchParams } from 'next/navigation';

/** Valeur d'un paramètre de l'URL (?id=…) ; la page doit être enveloppée dans un <Suspense>. */
export function useQueryParam(name: string): string {
  return useSearchParams().get(name) ?? '';
}

/** Identifiant numérique de l'URL, ou NaN s'il est absent ou invalide. */
export function useQueryId(name = 'id'): number {
  const value = useQueryParam(name);
  return /^\d+$/.test(value) ? Number(value) : Number.NaN;
}
