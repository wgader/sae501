'use client';

import { useEffect, useState } from 'react';
import { getAccountProfile } from '@/lib/api';

export type AssociationModules = {
  subventions: boolean;
  materiel: boolean;
  salles: boolean;
  evenements: boolean;
};

export function isAssociationModuleEnabled(
  modules: AssociationModules | null,
  module: keyof AssociationModules,
): boolean {
  return modules !== null && modules[module];
}

export function useAssociationModules(): AssociationModules | null {
  const [modules, setModules] = useState<AssociationModules | null>(null);

  useEffect(() => {
    let active = true;

    getAccountProfile()
      .then((profile) => {
        if (!active) return;
        setModules({
          subventions: profile.moduleSubventionActif === true,
          materiel: profile.moduleMaterielActif === true,
          salles: profile.moduleSalleActif === true,
          evenements: profile.moduleEvenementActif === true,
        });
      })
      .catch(() => {
        console.error('Impossible de charger les modules de l’association.');
        if (active) setModules({ subventions: false, materiel: false, salles: false, evenements: false });
      });

    return () => {
      active = false;
    };
  }, []);

  return modules;
}
