import AdminLayout from '@/components/admin/AdminLayout';
import AdminSectionPage from '@/components/admin/AdminSectionPage';

export default function AdminHistoriquePage() {
  return (
    <AdminLayout>
      <AdminSectionPage
        title="Historique"
        description="Consultez l'ensemble des actions et des décisions prises dans l'administration."
        emptyMessage="L'historique des actions apparaîtra ici."
      />
    </AdminLayout>
  );
}
