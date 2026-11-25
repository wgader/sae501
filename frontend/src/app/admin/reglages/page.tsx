'use client';

import { useState, useSyncExternalStore } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import EquipmentCategoriesPanel from '@/components/admin/settings/EquipmentCategoriesPanel';
import EquipmentSettingsPanel from '@/components/admin/settings/EquipmentSettingsPanel';
import FaqSettingsPanel from '@/components/admin/settings/FaqSettingsPanel';
import GrantSettingsPanel from '@/components/admin/settings/GrantSettingsPanel';
import LegalSettingsPanel from '@/components/admin/settings/LegalSettingsPanel';
import RoomSettingsPanel from '@/components/admin/settings/RoomSettingsPanel';
import SettingsTabs, { type SettingsTab } from '@/components/admin/settings/SettingsTabs';
import { accessFromRoles } from '@/lib/agentAccess';
import { readSession } from '@/lib/session';

const noSubscription = () => () => {};
const readRoles = () => readSession()?.user.roles.join(',') ?? '';

const ALL_TABS: SettingsTab[] = [
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
  {
    id: 'subventions',
    label: 'Subventions',
    description: 'Justificatifs requis et modèles de documents',
    module: 'subventions',
    panel: <GrantSettingsPanel />,
  },
  {
    id: 'faq',
    label: 'FAQ',
    description: 'Questions et réponses de la page d’accueil',
    module: 'faq',
    panel: <FaqSettingsPanel />,
  },
  {
    id: 'legal',
    label: 'Légal & CGU',
    description: 'Conditions d’utilisation et mentions légales',
    module: 'legal',
    panel: <LegalSettingsPanel />,
  },
];

/** Réglages de la plateforme, regroupés par module ; chaque agent voit ceux qu'il gère, les admins voient tout. */
export default function SettingsPage() {
  const roles = useSyncExternalStore(noSubscription, readRoles, () => '');
  const access = accessFromRoles(roles === '' ? [] : roles.split(','));

  const tabs = ALL_TABS.filter((tab) => {
    if (access.isAdmin) return true;
    if (tab.id === 'salles') return access.modules.includes('salles');
    if (tab.id === 'materiel') return access.modules.includes('materiel');
    if (tab.id === 'subventions') return access.modules.includes('subventions');
    // FAQ et Légal sont visibles pour tous les agents habilités à l'admin
    if (tab.id === 'faq' || tab.id === 'legal') return true;
    return false;
  });

  const [selected, setSelected] = useState(tabs[0]?.id ?? 'salles');

  return (
    <AdminLayout>
      <section className="mx-auto max-w-280 space-y-8">
        <AdminPageHeader
          title="Réglages"
          description="Paramétrez les règles de réservation, les documents de subvention, la FAQ et les mentions légales de la mairie."
        />
        {tabs.length > 0 && <SettingsTabs tabs={tabs} selected={selected} onSelect={setSelected} />}
      </section>
    </AdminLayout>
  );
}
