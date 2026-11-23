'use client';

import { useState, useSyncExternalStore } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import EquipmentCategoriesPanel from '@/components/admin/settings/EquipmentCategoriesPanel';
import EquipmentSettingsPanel from '@/components/admin/settings/EquipmentSettingsPanel';
import RoomSettingsPanel from '@/components/admin/settings/RoomSettingsPanel';
import SettingsTabs, { type SettingsTab } from '@/components/admin/settings/SettingsTabs';
import { accessFromRoles } from '@/lib/agentAccess';
import { readSession } from '@/lib/session';

const noSubscription = () => () => {};
const readRoles = () => readSession()?.user.roles.join(',') ?? '';

const TABS: SettingsTab[] = [
  {
    id: 'salles',
    label: 'Salles',
    description: 'Horaires et durée des réservations',
    module: 'rooms',
    panel: <RoomSettingsPanel />,
  },
  {
    id: 'materiel',
    label: 'Matériel',
    description: 'Service de prêt et catégories',
    module: 'equipment',
    panel: (
      <>
        <EquipmentSettingsPanel />
        <EquipmentCategoriesPanel />
      </>
    ),
  },
];

/** Réglages de la plateforme, regroupés par module ; chaque agent voit ceux qu'il gère. */
export default function SettingsPage() {
  const roles = useSyncExternalStore(noSubscription, readRoles, () => '');
  const access = accessFromRoles(roles === '' ? [] : roles.split(','));
  const tabs = TABS.filter((tab) => access.modules.includes(tab.id === 'salles' ? 'salles' : 'materiel'));
  const [selected, setSelected] = useState('salles');

  return (
    <AdminLayout>
      <section className="mx-auto max-w-280 space-y-8">
        <AdminPageHeader
          title="Réglages"
          description="Les règles appliquées aux demandes des associations. Chaque modification vaut pour les nouvelles demandes ; celles déjà déposées ne changent pas."
        />
        {tabs.length > 0 && <SettingsTabs tabs={tabs} selected={selected} onSelect={setSelected} />}
      </section>
    </AdminLayout>
  );
}
