'use client';

import { useCallback, useEffect, useState } from 'react';
import { getEquipmentCategories } from '@/lib/api/settings';
import type { EquipmentCategory } from '@/lib/api/types';
import { fallbackCategoryLabel } from '@/lib/equipmentCategories';
import { logger } from '@/lib/logger';

// Une seule requête par page, même si plusieurs cartes du catalogue demandent les libellés.
let pending: Promise<EquipmentCategory[]> | null = null;

function loadCategories(): Promise<EquipmentCategory[]> {
  pending ??= getEquipmentCategories().catch((error: unknown) => {
    pending = null;
    throw error;
  });
  return pending;
}

/** Catégories réglées par la mairie, et le libellé d'un code (repli lisible si la liste manque). */
export function useEquipmentCategories() {
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);

  useEffect(() => {
    let active = true;
    loadCategories()
      .then((data) => {
        if (active) setCategories(data);
      })
      .catch((error: unknown) => logger.warn('Catégories de matériel indisponibles', error));
    return () => {
      active = false;
    };
  }, []);

  const labelOf = useCallback(
    (code: string) => categories.find((category) => category.code === code)?.label ?? fallbackCategoryLabel(code),
    [categories],
  );

  return { categories, labelOf };
}
